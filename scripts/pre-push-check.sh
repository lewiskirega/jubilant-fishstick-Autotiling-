#!/usr/bin/env bash
# ==============================================================================
# Fedora AutoTile - Pre-Push CI/CD Verification & Auto-Fix Script
# Ensures all CI/CD standards are met locally before code is pushed to GitHub.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Styling
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

log_step() { echo -e "\n${BLUE}${BOLD}==>${NC} ${BOLD}$1${NC}"; }
log_pass() { echo -e "  ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
log_fail() { echo -e "  ${RED}✗ ERROR:${NC} $1" >&2; }

ERRORS_FOUND=0
AUTO_FIX=true

if [ "${1:-}" = "--no-fix" ]; then
    AUTO_FIX=false
fi

echo "=========================================================================="
echo "  Fedora AutoTile — Pre-Push CI/CD Quality Gate"
echo "=========================================================================="

# ------------------------------------------------------------------------------
# Check 1: Metadata JSON Integrity
# ------------------------------------------------------------------------------
log_step "[1/7] Validating metadata.json..."
if [ ! -f "${ROOT_DIR}/metadata.json" ]; then
    log_fail "metadata.json not found!"
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
else
    # Validate JSON syntax
    if ! node -e 'JSON.parse(require("fs").readFileSync("metadata.json", "utf8"))' >/dev/null 2>&1; then
        log_fail "metadata.json contains invalid JSON syntax!"
        ERRORS_FOUND=$((ERRORS_FOUND + 1))
    else
        UUID=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("metadata.json")).uuid || "")')
        VER_NAME=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("metadata.json"))["version-name"] || "")')
        VERSIONS=$(node -e 'console.log((JSON.parse(require("fs").readFileSync("metadata.json"))["shell-version"] || []).join(","))')

        if [ "$UUID" != "fedora-autotile@codefort.dev" ]; then
            log_warn "UUID is '$UUID' (expected 'fedora-autotile@codefort.dev')."
        else
            log_pass "UUID valid: $UUID"
        fi

        if [[ "$VERSIONS" != *"50"* ]] || [[ "$VERSIONS" != *"51"* ]]; then
            log_fail "metadata.json must declare support for both GNOME 50 and 51! Found: $VERSIONS"
            ERRORS_FOUND=$((ERRORS_FOUND + 1))
        else
            log_pass "Declared GNOME versions: $VERSIONS"
        fi

        log_pass "Version name: $VER_NAME"
    fi
fi

# ------------------------------------------------------------------------------
# Check 2: GSettings Schema Strict Compilation & Auto-Fix
# ------------------------------------------------------------------------------
log_step "[2/7] Checking GSettings Schema Validity..."
SCHEMA_FILE="${ROOT_DIR}/schemas/org.gnome.shell.extensions.fedora-autotile.gschema.xml"
if [ ! -f "$SCHEMA_FILE" ]; then
    log_fail "Missing schema XML file at $SCHEMA_FILE!"
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
else
    if command -v glib-compile-schemas >/dev/null 2>&1; then
        if ! glib-compile-schemas --strict "${ROOT_DIR}/schemas" >/dev/null 2>&1; then
            log_fail "GSettings schema failed strict validation!"
            ERRORS_FOUND=$((ERRORS_FOUND + 1))
        else
            log_pass "Schema XML is strictly valid."
            if [ ! -f "${ROOT_DIR}/schemas/gschemas.compiled" ] && [ "$AUTO_FIX" = true ]; then
                log_warn "schemas/gschemas.compiled missing. Compiling now..."
                glib-compile-schemas --strict "${ROOT_DIR}/schemas"
                log_pass "Auto-compiled schemas/gschemas.compiled."
            fi
        fi
    else
        log_warn "glib-compile-schemas not available in environment; skipping schema compilation check."
    fi
fi

# ------------------------------------------------------------------------------
# Check 3: JavaScript Syntax Check Across Entire Codebase
# ------------------------------------------------------------------------------
log_step "[3/7] Verifying JavaScript Syntax (ESM)..."
SYNTAX_FAIL=0
JS_FILES=$(find "${ROOT_DIR}/src" "${ROOT_DIR}/tests" -name "*.js")
JS_FILES="$JS_FILES ${ROOT_DIR}/extension.js ${ROOT_DIR}/prefs.js"

for file in $JS_FILES; do
    if [ -f "$file" ]; then
        if ! node --check "$file" >/dev/null 2>&1; then
            log_fail "Syntax error in $file"
            SYNTAX_FAIL=1
        fi
    fi
done

if [ $SYNTAX_FAIL -eq 0 ]; then
    log_pass "All JavaScript files passed syntax verification."
else
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
fi

# ------------------------------------------------------------------------------
# Check 4: Automated Test Suite (Node.js & Native GJS)
# ------------------------------------------------------------------------------
log_step "[4/7] Running Automated Test Suite..."
if [ -f "${ROOT_DIR}/scripts/test.sh" ]; then
    if bash "${ROOT_DIR}/scripts/test.sh" >/tmp/autotile-test.log 2>&1; then
        log_pass "All unit and layout tests passed on Node.js and GJS."
    else
        log_fail "Test suite failed! Log output:"
        cat /tmp/autotile-test.log >&2
        ERRORS_FOUND=$((ERRORS_FOUND + 1))
    fi
else
    log_fail "scripts/test.sh not found!"
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
fi

# ------------------------------------------------------------------------------
# Check 5: Production ZIP Packaging Verification
# ------------------------------------------------------------------------------
log_step "[5/7] Verifying Packaging & Asset Cleanliness..."
if [ -f "${ROOT_DIR}/scripts/pack.sh" ]; then
    bash "${ROOT_DIR}/scripts/pack.sh" >/tmp/autotile-pack.log 2>&1 || {
        log_fail "scripts/pack.sh failed to package extension!"
        cat /tmp/autotile-pack.log >&2
        ERRORS_FOUND=$((ERRORS_FOUND + 1))
    }

    ZIP_PATH="${ROOT_DIR}/fedora-autotile.zip"
    if [ -f "$ZIP_PATH" ]; then
        # Check required files using pre-captured listing to prevent SIGPIPE in pipefail
        ZIP_LISTING=$(unzip -l "$ZIP_PATH")
        MISSING_FILES=0
        for req in "metadata.json" "extension.js" "prefs.js" "schemas/org.gnome.shell.extensions.fedora-autotile.gschema.xml" "schemas/gschemas.compiled"; do
            if ! echo "$ZIP_LISTING" | grep -F "$req" >/dev/null; then
                log_fail "Package ZIP is missing required asset: $req"
                MISSING_FILES=1
            fi
        done

        # Check for forbidden development/test files in ZIP
        if echo "$ZIP_LISTING" | grep -E "(tests/|scripts/|\.git/|\.github/)" >/dev/null 2>&1; then
            log_fail "Package ZIP contains forbidden test/script/git files!"
            ERRORS_FOUND=$((ERRORS_FOUND + 1))
        fi

        if [ $MISSING_FILES -eq 0 ]; then
            log_pass "Production package structure and contents verified."
        else
            ERRORS_FOUND=$((ERRORS_FOUND + 1))
        fi
    fi
fi

# ------------------------------------------------------------------------------
# Check 6: GitHub Actions Workflow YAML Validation
# ------------------------------------------------------------------------------
log_step "[6/7] Validating GitHub Actions Workflows..."
WORKFLOW_ERR=0
for yml in "${ROOT_DIR}/.github/workflows/"*.yml "${ROOT_DIR}/.github/ISSUE_TEMPLATE/"*.yml; do
    if [ -f "$yml" ]; then
        if command -v python3 >/dev/null 2>&1; then
            python3 -c "
import sys
try:
    import yaml
    yaml.safe_load(open('$yml'))
except Exception as e:
    sys.exit(1)
" >/dev/null 2>&1 || {
                # If pyyaml isn't available, basic syntax checks
                if grep -n $'\t' "$yml" >/dev/null 2>&1; then
                    log_fail "YAML file $yml contains tab indentation!"
                    WORKFLOW_ERR=1
                fi
            }
        fi
    fi
done

if [ $WORKFLOW_ERR -eq 0 ]; then
    log_pass "GitHub Actions workflow configurations valid."
else
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
fi

# ------------------------------------------------------------------------------
# Check 7: Git Working Tree Cleanliness
# ------------------------------------------------------------------------------
log_step "[7/7] Checking Git Cleanliness & Branch Alignment..."
cd "${ROOT_DIR}"
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    log_warn "Working directory has unstaged or uncommitted changes:"
    git status --short
    if [ "$AUTO_FIX" = true ]; then
        log_warn "Auto-fixing: Please review changes and commit them before pushing."
    fi
else
    log_pass "Working directory is clean."
fi

# ------------------------------------------------------------------------------
# Summary & Exit Code
# ------------------------------------------------------------------------------
echo "=========================================================================="
if [ $ERRORS_FOUND -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ ALL CI/CD PRE-PUSH CHECKS PASSED SUCCESSFULLY!${NC}"
    echo "  Your code meets all quality, test, packaging, and schema requirements."
    echo "  Safe to push to GitHub."
    echo "=========================================================================="
    exit 0
else
    echo -e "${RED}${BOLD}✗ CI/CD PRE-PUSH CHECKS FAILED WITH ${ERRORS_FOUND} ERROR(S)!${NC}"
    echo "  Please address the issues highlighted above before pushing to GitHub."
    echo "=========================================================================="
    exit 1
fi
