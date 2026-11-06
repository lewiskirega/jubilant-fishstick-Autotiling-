#!/usr/bin/env bash
# ==============================================================================
# Fedora AutoTile - Developer Local Installer
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

UUID="fedora-autotile@codefort.dev"
TARGET_DIR="${HOME}/.local/share/gnome-shell/extensions/${UUID}"

echo "==> Running local developer build & install..."
bash "${SCRIPT_DIR}/build.sh"

echo "--> Target directory: ${TARGET_DIR}"
rm -rf "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"

cp -r "${ROOT_DIR}/metadata.json" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/extension.js" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/prefs.js" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/stylesheet.css" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/src" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/schemas" "${TARGET_DIR}/"

glib-compile-schemas --strict "${TARGET_DIR}/schemas"

if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions enable "${UUID}" 2>/dev/null || true
fi

echo "✓ Developer install completed to ${TARGET_DIR}."

