#!/usr/bin/env bash
# ==============================================================================
# Fedora AutoTile - User Installation Script
# https://github.com/lewiskirega/jubilant-fishstick-Autotiling-
# ==============================================================================
set -euo pipefail

UUID="fedora-autotile@codefort.dev"
REPO="${FEDORA_AUTOTILE_REPO:-}"
if [ -z "${REPO}" ]; then
    if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        REMOTE_URL=$(git config --get remote.origin.url || true)
        if [[ "${REMOTE_URL}" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)? ]]; then
            REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
        fi
    fi
fi
if [ -z "${REPO}" ]; then
    REPO="lewiskirega/jubilant-fishstick-Autotiling-"
fi
TARGET_DIR="${HOME}/.local/share/gnome-shell/extensions/${UUID}"
TMP_DIR=""

# Color output helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}==>${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}WARNING:${NC} $1"; }
log_error() { echo -e "${RED}ERROR:${NC} $1" >&2; }

cleanup() {
    if [ -n "${TMP_DIR}" ] && [ -d "${TMP_DIR}" ]; then
        rm -rf "${TMP_DIR}"
    fi
}
trap cleanup EXIT

# ------------------------------------------------------------------------------
# 1. Environment & Privilege Checks
# ------------------------------------------------------------------------------
if [ "$(id -u)" -eq 0 ]; then
    log_error "Do not run this script with sudo or as root. Extensions must be installed per-user."
    exit 1
fi

log_info "Detecting desktop environment..."
DESKTOP_ENV="${XDG_CURRENT_DESKTOP:-unknown}"
if [[ "${DESKTOP_ENV,,}" != *"gnome"* ]]; then
    log_warn "Current desktop environment is '${DESKTOP_ENV}'. Fedora AutoTile is designed for GNOME Shell."
fi

if ! command -v gnome-shell >/dev/null 2>&1; then
    log_error "GNOME Shell executable not found. Please install GNOME Shell first."
    exit 1
fi

SHELL_VERSION_RAW=$(gnome-shell --version 2>/dev/null | awk '{print $3}')
SHELL_MAJOR=$(echo "${SHELL_VERSION_RAW}" | cut -d. -f1)

log_info "Detected GNOME Shell version: ${SHELL_VERSION_RAW} (Major: ${SHELL_MAJOR})"
if [ "${SHELL_MAJOR}" -lt 50 ]; then
    log_error "GNOME Shell ${SHELL_VERSION_RAW} is not supported. Fedora AutoTile requires GNOME 50 or 51+."
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. Parse Arguments (Source, Local ZIP, or GitHub Release)
# ------------------------------------------------------------------------------
LOCAL_ZIP=""
FROM_SOURCE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --file|-f)
            LOCAL_ZIP="$2"
            shift 2
            ;;
        --source|-s)
            FROM_SOURCE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --file, -f <path>    Install from a locally downloaded release ZIP"
            echo "  --source, -s         Install directly from the current source repository"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Without options, the installer installs from current source if run inside"
            echo "a repository clone, or downloads the latest release from GitHub."
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

TMP_DIR=$(mktemp -d "/tmp/fedora-autotile-install.XXXXXX")
SOURCE_PAYLOAD=""

if [ -n "${LOCAL_ZIP}" ]; then
    # --------------------------------------------------------------------------
    # Case A: Local ZIP provided
    # --------------------------------------------------------------------------
    if [ ! -f "${LOCAL_ZIP}" ]; then
        log_error "Specified ZIP file does not exist: ${LOCAL_ZIP}"
        exit 1
    fi
    log_info "Installing from local ZIP archive: ${LOCAL_ZIP}"
    unzip -q "${LOCAL_ZIP}" -d "${TMP_DIR}/payload"
    SOURCE_PAYLOAD="${TMP_DIR}/payload"

elif [ "${FROM_SOURCE}" = true ] || [ -f "${ROOT_DIR}/metadata.json" ]; then
    # --------------------------------------------------------------------------
    # Case B: Local source checkout
    # --------------------------------------------------------------------------
    log_info "Installing from local source tree..."
    if [ ! -f "${ROOT_DIR}/metadata.json" ] || [ ! -d "${ROOT_DIR}/src" ]; then
        log_error "Invalid source repository structure at ${ROOT_DIR}."
        exit 1
    fi

    # Compile schemas
    log_info "Compiling GSettings schemas..."
    glib-compile-schemas --strict "${ROOT_DIR}/schemas"

    SOURCE_PAYLOAD="${ROOT_DIR}"

else
    # --------------------------------------------------------------------------
    # Case C: Download latest release from GitHub
    # --------------------------------------------------------------------------
    log_info "Fetching latest release information from GitHub (${REPO})..."

    if ! command -v curl >/dev/null 2>&1; then
        log_error "curl is required to download the release. Please install curl."
        exit 1
    fi

    LATEST_JSON=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" || true)
    DOWNLOAD_URL=$(echo "${LATEST_JSON}" | grep -o 'https://[^"]*fedora-autotile\.zip' | head -n 1 || true)
    CHECKSUM_URL=$(echo "${LATEST_JSON}" | grep -o 'https://[^"]*SHA256SUMS\.txt' | head -n 1 || true)

    if [ -z "${DOWNLOAD_URL}" ]; then
        DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/fedora-autotile.zip"
        CHECKSUM_URL="https://github.com/${REPO}/releases/latest/download/SHA256SUMS.txt"
    fi

    ZIP_DEST="${TMP_DIR}/fedora-autotile.zip"
    SUM_DEST="${TMP_DIR}/SHA256SUMS.txt"

    log_info "Downloading ${DOWNLOAD_URL}..."
    curl -fL -o "${ZIP_DEST}" "${DOWNLOAD_URL}"

    # Verify Checksum if available
    if curl -fLs -o "${SUM_DEST}" "${CHECKSUM_URL}" 2>/dev/null; then
        log_info "Verifying SHA256 checksum..."
        (cd "${TMP_DIR}" && grep "fedora-autotile\.zip" SHA256SUMS.txt | sha256sum -c -) || {
            log_error "SHA256 checksum verification failed!"
            exit 1
        }
        log_success "Checksum verified."
    else
        log_warn "Checksum file not found on release; skipping checksum validation."
    fi

    unzip -q "${ZIP_DEST}" -d "${TMP_DIR}/payload"
    SOURCE_PAYLOAD="${TMP_DIR}/payload"
fi

# ------------------------------------------------------------------------------
# 3. Validate Payload Structure
# ------------------------------------------------------------------------------
log_info "Validating extension payload..."
for required_file in "metadata.json" "extension.js" "prefs.js"; do
    if [ ! -f "${SOURCE_PAYLOAD}/${required_file}" ]; then
        log_error "Payload is missing required file: ${required_file}"
        exit 1
    fi
done

if [ ! -d "${SOURCE_PAYLOAD}/src" ]; then
    log_error "Payload is missing required src/ directory."
    exit 1
fi

if [ ! -f "${SOURCE_PAYLOAD}/schemas/org.gnome.shell.extensions.fedora-autotile.gschema.xml" ]; then
    log_error "Payload is missing GSettings schema file."
    exit 1
fi

# ------------------------------------------------------------------------------
# 4. Safe Installation into User Extension Directory
# ------------------------------------------------------------------------------
log_info "Target directory: ${TARGET_DIR}"
rm -rf "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"

cp -r "${SOURCE_PAYLOAD}/metadata.json" "${TARGET_DIR}/"
cp -r "${SOURCE_PAYLOAD}/extension.js" "${TARGET_DIR}/"
cp -r "${SOURCE_PAYLOAD}/prefs.js" "${TARGET_DIR}/"
cp -r "${SOURCE_PAYLOAD}/stylesheet.css" "${TARGET_DIR}/"
cp -r "${SOURCE_PAYLOAD}/src" "${TARGET_DIR}/"
cp -r "${SOURCE_PAYLOAD}/schemas" "${TARGET_DIR}/"

# Always compile schemas in target directory
log_info "Compiling GSettings schemas in target directory..."
glib-compile-schemas --strict "${TARGET_DIR}/schemas"

# ------------------------------------------------------------------------------
# 5. Enable Extension via GNOME Tools
# ------------------------------------------------------------------------------
log_info "Enabling Fedora AutoTile..."
if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions enable "${UUID}" 2>/dev/null || true
fi

# Also ensure it is added to GSettings enabled-extensions safely
CURRENT_EXTS=$(gsettings get org.gnome.shell enabled-extensions 2>/dev/null || echo "[]")
if [[ "${CURRENT_EXTS}" != *"'${UUID}'"* ]]; then
    NEW_EXTS=$(echo "${CURRENT_EXTS}" | sed "s/]/, '${UUID}']/" | sed "s/\[, /\[/")
    gsettings set org.gnome.shell enabled-extensions "${NEW_EXTS}" 2>/dev/null || true
fi

log_success "Fedora AutoTile has been successfully installed!"
echo ""
echo "=========================================================================="
echo "  Fedora AutoTile (${UUID}) is ready."
echo ""
echo "  * If you are running GNOME on Wayland and installed for the first time,"
echo "    please log out and log back in so GNOME Shell discovers new extensions."
echo ""
echo "  * To configure settings, run:"
echo "      gnome-extensions prefs ${UUID}"
echo "=========================================================================="
