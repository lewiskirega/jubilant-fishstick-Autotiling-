#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> Running Fedora AutoTile Test Suite..."

echo "[1/3] Dynamic Grid Calculations"
node "${ROOT_DIR}/tests/testGridLayout.js"
gjs -m "${ROOT_DIR}/tests/testGridLayout.js"

echo "[2/3] Layout Factory & Multi-Layout Suite"
node "${ROOT_DIR}/tests/testAllLayouts.js"
gjs -m "${ROOT_DIR}/tests/testAllLayouts.js"

echo "[3/3] Floating Rules & Window Exception Matcher"
node "${ROOT_DIR}/tests/testFloatingRules.js"
gjs -m "${ROOT_DIR}/tests/testFloatingRules.js"

echo "==> All automated tests PASSED on both Node.js and native GJS!"

