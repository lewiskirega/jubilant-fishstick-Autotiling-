#!/usr/bin/env bash
# ==============================================================================
# Fedora AutoTile - Update Script
# https://github.com/lewiskirega/fedora-autotile
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

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

if [ "$(id -u)" -eq 0 ]; then
    log_error "Do not run this script with sudo or as root."
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    log_error "curl is required to check and download updates."
    exit 1
fi

if [ ! -d "${TARGET_DIR}" ] || [ ! -f "${TARGET_DIR}/metadata.json" ]; then
    log_error "Fedora AutoTile is not currently installed. Run install.sh first."
    exit 1
fi

# Detect installed version
INSTALLED_VER=$(grep -o '"version-name"[[:space:]]*:[[:space:]]*"[^"]*"' "${TARGET_DIR}/metadata.json" 2>/dev/null | cut -d'"' -f4 || echo "")
if [ -z "${INSTALLED_VER}" ]; then
    INSTALLED_VER=$(grep -o '"version"[[:space:]]*:[[:space:]]*[0-9]*' "${TARGET_DIR}/metadata.json" 2>/dev/null | awk '{print $2}' || echo "0")
fi
log_info "Installed version: ${INSTALLED_VER}"

# Fetch latest release info
log_info "Querying latest release for ${REPO}..."
AUTH_HEADER=()
if [ -n "${GITHUB_TOKEN:-}" ]; then
    AUTH_HEADER=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
elif [ -n "${GH_TOKEN:-}" ]; then
    AUTH_HEADER=(-H "Authorization: Bearer ${GH_TOKEN}")
fi

LATEST_JSON=$(curl -s "${AUTH_HEADER[@]}" "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null || true)
LATEST_TAG=$(echo "${LATEST_JSON}" | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n 1 | cut -d'"' -f4 || true)

# Rate-limit fallback: query web release redirect
if [ -z "${LATEST_TAG}" ]; then
    REDIRECT_URL=$(curl -sIL -o /dev/null -w "%{url_effective}\n" "https://github.com/${REPO}/releases/latest" 2>/dev/null || true)
    if [[ "${REDIRECT_URL}" =~ /releases/tag/([^/]+)$ ]]; then
        LATEST_TAG="${BASH_REMATCH[1]}"
    fi
fi

# Fallback: query git tags if running inside repository
if [ -z "${LATEST_TAG}" ] && command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || true)
fi

if [ -z "${LATEST_TAG}" ]; then
    log_error "Could not retrieve latest release from GitHub."
    exit 1
fi

LATEST_VER="${LATEST_TAG#v}"
log_info "Latest available release: ${LATEST_TAG} (${LATEST_VER})"

if [ "${INSTALLED_VER}" = "${LATEST_VER}" ]; then
    log_success "Fedora AutoTile is already up to date (${INSTALLED_VER})."
    exit 0
fi

log_info "New version available: ${LATEST_VER} (Installed: ${INSTALLED_VER})"

DOWNLOAD_URL=$(echo "${LATEST_JSON}" | grep -o 'https://[^"]*fedora-autotile\.zip' | head -n 1 || true)
CHECKSUM_URL=$(echo "${LATEST_JSON}" | grep -o 'https://[^"]*SHA256SUMS\.txt' | head -n 1 || true)

if [ -z "${DOWNLOAD_URL}" ]; then
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/fedora-autotile.zip"
    CHECKSUM_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/SHA256SUMS.txt"
fi

TMP_DIR=$(mktemp -d "/tmp/fedora-autotile-update.XXXXXX")
ZIP_DEST="${TMP_DIR}/fedora-autotile.zip"
SUM_DEST="${TMP_DIR}/SHA256SUMS.txt"

log_info "Downloading update from ${DOWNLOAD_URL}..."
curl -fL -o "${ZIP_DEST}" "${DOWNLOAD_URL}"

# Verify Checksum
if curl -fLs -o "${SUM_DEST}" "${CHECKSUM_URL}" 2>/dev/null; then
    log_info "Verifying SHA256 checksum..."
    (cd "${TMP_DIR}" && grep "fedora-autotile\.zip" SHA256SUMS.txt | sha256sum -c -) || {
        log_error "SHA256 checksum verification failed!"
        exit 1
    }
    log_success "Checksum verified."
else
    log_warn "Checksum file not available for release ${LATEST_TAG}; proceeding with caution."
fi

# Extract and validate payload
unzip -q "${ZIP_DEST}" -d "${TMP_DIR}/payload"

for required in "metadata.json" "extension.js" "prefs.js"; do
    if [ ! -f "${TMP_DIR}/payload/${required}" ]; then
        log_error "Downloaded update package is corrupt or missing ${required}."
        exit 1
    fi
done

# Perform safe update
log_info "Applying update to ${TARGET_DIR}..."
rm -rf "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"
cp -r "${TMP_DIR}/payload/"* "${TARGET_DIR}/"

# Recompile schemas in target directory
log_info "Compiling GSettings schemas..."
glib-compile-schemas --strict "${TARGET_DIR}/schemas"

log_success "Successfully updated Fedora AutoTile to ${LATEST_TAG}!"
echo ""
echo "=========================================================================="
echo "  Update complete."
echo "  * Under Wayland, log out and back in to let GNOME Shell load the new code."
echo "  * Under X11, press Alt+F2, type 'r', and press Enter."
echo "=========================================================================="

