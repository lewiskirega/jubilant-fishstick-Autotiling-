#!/usr/bin/env bash
set -euo pipefail

UUID="fedora-autotile@fedoraproject.org"
TARGET_DIR="${HOME}/.local/share/gnome-shell/extensions/${UUID}"

echo "==> Uninstalling Fedora AutoTile Extension..."
if [ -d "${TARGET_DIR}" ]; then
    rm -rf "${TARGET_DIR}"
    echo "--> Removed ${TARGET_DIR}"
else
    echo "--> Extension was not found at ${TARGET_DIR}"
fi

echo "==> Uninstall completed."
