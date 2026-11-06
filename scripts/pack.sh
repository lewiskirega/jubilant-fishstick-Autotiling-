#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

UUID="fedora-autotile@fedoraproject.org"
OUTPUT_ZIP="${ROOT_DIR}/${UUID}.zip"

echo "==> Packaging Fedora AutoTile Extension..."
bash "${SCRIPT_DIR}/build.sh"

rm -f "${OUTPUT_ZIP}"

# Check if gnome-extensions pack is available
if command -v gnome-extensions >/dev/null 2>&1; then
    echo "--> Packaging with gnome-extensions pack..."
    cd "${ROOT_DIR}"
    gnome-extensions pack \
        --force \
        --extra-source=src \
        --extra-source=stylesheet.css \
        "${ROOT_DIR}"
    echo "--> Created package: $(ls -la fedora-autotile*.zip 2>/dev/null || ls -la *.zip)"
else
    echo "--> Packaging with zip..."
    cd "${ROOT_DIR}"
    zip -r "${OUTPUT_ZIP}" metadata.json extension.js prefs.js stylesheet.css src schemas/
    echo "--> Created: ${OUTPUT_ZIP}"
fi

echo "==> Packaging complete!"
