#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

UUID="fedora-autotile@fedoraproject.org"

echo "==> Fedora AutoTile Development Helper"
echo "Options:"
echo "  1) Build and Run Tests"
echo "  2) Package extension ZIP"
echo "  3) Install to ~/.local/share/gnome-shell/extensions/"
echo "  4) View GNOME Shell extension journal logs"

case "${1:-1}" in
    1|test|build)
        bash "${SCRIPT_DIR}/build.sh"
        ;;
    2|pack)
        bash "${SCRIPT_DIR}/pack.sh"
        ;;
    3|install)
        bash "${SCRIPT_DIR}/install.sh"
        ;;
    4|logs)
        journalctl -f -o cat /usr/bin/gnome-shell | grep -i autotile
        ;;
    *)
        echo "Usage: $0 [build|pack|install|logs]"
        exit 1
        ;;
esac
