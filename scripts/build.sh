#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> Building Fedora AutoTile Extension..."

# 1. Compile GSettings schemas
echo "--> Compiling GSettings schemas..."
glib-compile-schemas --strict "${ROOT_DIR}/schemas"

# 2. Syntax validation
echo "--> Validating JavaScript syntax..."
node --check "${ROOT_DIR}/src/core/geometry.js"
node --check "${ROOT_DIR}/src/layouts/grid.js"
node --check "${ROOT_DIR}/src/layouts/masterStack.js"
node --check "${ROOT_DIR}/src/layouts/horizontal.js"
node --check "${ROOT_DIR}/src/layouts/vertical.js"
node --check "${ROOT_DIR}/src/layouts/adaptive.js"
node --check "${ROOT_DIR}/src/layouts/layoutFactory.js"
node --check "${ROOT_DIR}/src/managers/floatingManager.js"
node --check "${ROOT_DIR}/src/managers/workspaceManager.js"
node --check "${ROOT_DIR}/src/managers/monitorManager.js"
node --check "${ROOT_DIR}/src/core/windowState.js"
node --check "${ROOT_DIR}/src/core/windowTracker.js"
node --check "${ROOT_DIR}/src/core/tilingEngine.js"
node --check "${ROOT_DIR}/src/managers/keyboardManager.js"
node --check "${ROOT_DIR}/src/ui/panelIndicator.js"
node --check "${ROOT_DIR}/src/ui/focusHint.js"
node --check "${ROOT_DIR}/extension.js"
node --check "${ROOT_DIR}/prefs.js"

echo "--> Running automated test suite..."
bash "${SCRIPT_DIR}/test.sh"

echo "==> Build completed successfully!"

