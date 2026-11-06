#!/usr/bin/env bash
# ==============================================================================
# Fedora AutoTile - Packaging Script
# Produces clean, installable distribution ZIP archives
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

UUID="fedora-autotile@codefort.dev"
CANONICAL_ZIP="${ROOT_DIR}/fedora-autotile.zip"
EXTENSION_ZIP="${ROOT_DIR}/${UUID}.shell-extension.zip"

echo "==> Packaging Fedora AutoTile Extension..."
bash "${SCRIPT_DIR}/build.sh"

cd "${ROOT_DIR}"
rm -f "${CANONICAL_ZIP}" "${EXTENSION_ZIP}" *.zip

# Ensure schema is strictly compiled
glib-compile-schemas --strict "${ROOT_DIR}/schemas"

echo "--> Building clean production ZIP archive..."
zip -r "${CANONICAL_ZIP}" \
    metadata.json \
    extension.js \
    prefs.js \
    stylesheet.css \
    schemas/org.gnome.shell.extensions.fedora-autotile.gschema.xml \
    schemas/gschemas.compiled \
    src/

cp "${CANONICAL_ZIP}" "${EXTENSION_ZIP}"

echo "--> Verifying package contents:"
unzip -l "${CANONICAL_ZIP}"

echo "==> Successfully created:"
echo "    - ${CANONICAL_ZIP}"
echo "    - ${EXTENSION_ZIP}"
