#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

UUID="fedora-autotile@fedoraproject.org"
TARGET_DIR="${HOME}/.local/share/gnome-shell/extensions/${UUID}"

echo "==> Installing Fedora AutoTile Extension..."
bash "${SCRIPT_DIR}/build.sh"

echo "--> Target directory: ${TARGET_DIR}"
rm -rf "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"

# Copy all extension assets
cp -r "${ROOT_DIR}/metadata.json" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/extension.js" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/prefs.js" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/stylesheet.css" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/src" "${TARGET_DIR}/"
cp -r "${ROOT_DIR}/schemas" "${TARGET_DIR}/"

# Ensure schemas are compiled in the installed location
glib-compile-schemas --strict "${TARGET_DIR}/schemas"

echo "==> Extension installed successfully to ${TARGET_DIR}"
echo "    To enable, run: gnome-extensions enable ${UUID}"
echo "    Under Wayland, log out and back in to let GNOME Shell load new extensions."
