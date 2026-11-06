#!/usr/bin/env bash
# ==============================================================================
# Fedora AutoTile - Uninstallation Script
# https://github.com/lewiskirega/fedora-autotile
# ==============================================================================
set -euo pipefail

UUID="fedora-autotile@codefort.dev"
SCHEMA_ID="org.gnome.shell.extensions.fedora-autotile"
TARGET_DIR="${HOME}/.local/share/gnome-shell/extensions/${UUID}"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}==>${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}WARNING:${NC} $1"; }

RESET_SETTINGS=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --reset-settings)
            RESET_SETTINGS=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --reset-settings    Also reset all Fedora AutoTile GSettings preferences"
            echo "  --help, -h          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

if [ "$(id -u)" -eq 0 ]; then
    echo -e "${RED}ERROR:${NC} Do not run this script with sudo or as root." >&2
    exit 1
fi

log_info "Disabling Fedora AutoTile extension..."
if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions disable "${UUID}" 2>/dev/null || true
fi

# Remove from GSettings enabled-extensions
CURRENT_EXTS=$(gsettings get org.gnome.shell enabled-extensions 2>/dev/null || echo "[]")
if [[ "${CURRENT_EXTS}" == *"'${UUID}'"* ]]; then
    NEW_EXTS=$(echo "${CURRENT_EXTS}" | sed "s/'${UUID}', //g" | sed "s/, '${UUID}'//g" | sed "s/'${UUID}'//g")
    gsettings set org.gnome.shell enabled-extensions "${NEW_EXTS}" 2>/dev/null || true
fi

log_info "Removing extension directory: ${TARGET_DIR}..."
if [ -d "${TARGET_DIR}" ]; then
    rm -rf "${TARGET_DIR}"
    log_success "Extension files removed."
else
    log_warn "Target directory ${TARGET_DIR} was not found."
fi

if [ "${RESET_SETTINGS}" = true ]; then
    log_info "Resetting GSettings preferences for ${SCHEMA_ID}..."
    if command -v gsettings >/dev/null 2>&1; then
        KEYS=(
            "enable-tiling"
            "default-layout"
            "inner-gap"
            "outer-gap"
            "horizontal-gap"
            "vertical-gap"
            "floating-applications"
            "toggle-tiling"
            "focus-left"
            "focus-right"
            "focus-up"
            "focus-down"
            "move-left"
            "move-right"
            "move-up"
            "move-down"
            "toggle-floating"
            "cycle-layout"
            "move-to-workspace-up"
            "move-to-workspace-down"
            "move-to-monitor-left"
            "move-to-monitor-right"
        )
        for k in "${KEYS[@]}"; do
            gsettings reset "${SCHEMA_ID}" "${k}" 2>/dev/null || true
        done
        log_success "Preferences reset to defaults."
    fi
else
    log_info "User preferences were preserved. (Run with --reset-settings to wipe preferences)."
fi

log_success "Fedora AutoTile has been completely uninstalled."
