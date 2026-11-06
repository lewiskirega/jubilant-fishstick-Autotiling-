# Fedora AutoTile — Pop Shell Alternative for Modern GNOME

[![CI](https://github.com/lewiskirega/fedora-autotile/actions/workflows/ci.yml/badge.svg)](https://github.com/lewiskirega/fedora-autotile/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/lewiskirega/fedora-autotile?include_prereleases&style=flat-square)](https://github.com/lewiskirega/fedora-autotile/releases)
[![GNOME Versions](https://img.shields.io/badge/GNOME-50%20%7C%2051-blue?style=flat-square)](https://www.gnome.org/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)

**Fedora AutoTile** is a native GNOME Shell extension inspired by Pop Shell's automatic tiling and keyboard-driven window management, engineered from the ground up for modern GNOME (GNOME 50 and 51+), GJS ES modules, Mutter, Wayland, and Libadwaita.

---

## Why Fedora AutoTile?

Pop Shell set the standard for automatic window tiling on GNOME desktops. However, modern GNOME releases (GNOME 45 through GNOME 51) introduced architectural overhauls: pure ES modules, unified Wayland event loops, strict Mutter geometry constraints, and updated Libadwaita components. Legacy tiling extensions frequently crash on GNOME 51 due to deprecated Clutter/St properties (such as `vertical` on `St.BoxLayout`), asynchronous Wayland configure races, and unmanaged signal leaks.

**Fedora AutoTile** recreates the essential Pop Shell automatic tiling and keyboard-driven workflow as a native, modern, and reliable GNOME extension without external window managers or X11 hacks.

### How It Differs from Basic Window Tiling
- **Dynamic Grid Reflow**: Rather than simple 50/50 quarter-snapping, Fedora AutoTile dynamically partitions available screen space based on display aspect ratio and window count, ensuring zero wasted screen space.
- **True Wayland Native**: Safe asynchronous geometry calculation with re-entrancy protection and debounced idle reflows to eliminate window move feedback loops.
- **Window Minimum Size Awareness**: Queries application minimum dimensions (`get_min_size()`) so fixed-size tools or dialogs never overflow or overlap.
- **Dock, Panel & Strut Respect**: Queries work area per monitor (`workspace.get_work_area_for_monitor()`) rather than raw monitor pixels.

---

## Screenshots

> Visual previews and guidelines for community screenshots are located in [`screenshots/`](screenshots/README.md).

---

## Features

### 1. Automatic Tiling
- **Dynamic Grid (Default)**: Automatically tiles newly opened windows into a balanced grid and dynamically reorganizes remaining windows when applications close.
- **Multi-Monitor Contexts**: Independent tiling context per connected monitor.
- **Per-Workspace Isolation**: Workspaces maintain independent layouts and window order.
- **Window Restoral**: Restores pre-tiled geometry when untiled or when the extension is disabled.

### 2. 5 Layout Engines
Switch layouts on the fly without restarting GNOME Shell:
1. **Dynamic Grid** (Default): Aspect-ratio aware proportional grid.
2. **Master & Stack**: Primary master window with a secondary vertical stack.
3. **Horizontal Split**: Equal vertical columns side-by-side.
4. **Vertical Split**: Equal horizontal rows stacked top-to-bottom.
5. **Adaptive Grid**: Adapts intelligently for ultrawide displays (21:9 / 32:9) with a 3-column center-master layout.

### 3. Keyboard-Driven Navigation
Configurable shortcuts using GNOME Shell's native `Main.wm.addKeybinding`:

| Action | Default Shortcut |
| :--- | :--- |
| **Toggle Automatic Tiling** | `Super + Y` |
| **Focus Left** | `Super + H` / `Super + Left` |
| **Focus Right** | `Super + L` / `Super + Right` |
| **Focus Up** | `Super + K` / `Super + Up` |
| **Focus Down** | `Super + J` / `Super + Down` |
| **Swap / Move Window Left** | `Super + Shift + H` / `Super + Shift + Left` |
| **Swap / Move Window Right** | `Super + Shift + L` / `Super + Shift + Right` |
| **Swap / Move Window Up** | `Super + Shift + K` / `Super + Shift + Up` |
| **Swap / Move Window Down** | `Super + Shift + J` / `Super + Shift + Down` |
| **Toggle Floating Mode** | `Super + G` |
| **Cycle Layout Strategy** | `Super + Space` |
| **Move to Previous Workspace** | `Super + Alt + Up` |
| **Move to Next Workspace** | `Super + Alt + Down` |
| **Move to Left Monitor** | `Super + Ctrl + Left` |
| **Move to Right Monitor** | `Super + Ctrl + Right` |

### 4. Intelligent Floating Window Management
- Automatically excludes dialogs, modals, transients, preferences, and fixed-size utilities.
- Configurable application ID and WM class exception list in GSettings.
- Instant manual float toggle for any focused window (`Super + G`).

### 5. Configurable Window Gaps
- Inner gaps (spacing between windows).
- Outer margins (border distance from screen edges).
- Distinct horizontal and vertical gap controls.

### 6. User Interface
- **Top Panel Quick Menu Indicator**: Status indicator with master toggle, active layout picker, and preferences shortcut.
- **GTK4 / Libadwaita Preferences**: Modern settings window with General, Gaps, Floating Rules, and Shortcuts pages.

---

## Compatibility

| Environment | Supported | Notes |
| :--- | :--- | :--- |
| **GNOME 51** | :white_check_mark: Yes | Tested on GNOME Shell 51.1 & Mutter 51.1 |
| **GNOME 50** | :white_check_mark: Yes | Tested on GNOME Shell 50.x ESM |
| **Fedora Workstation** | :white_check_mark: Yes | Primary development and test distribution |
| **Wayland** | :white_check_mark: Yes | Recommended and fully supported natively |
| **X11 / Xwayland** | :white_check_mark: Yes | Supported via standard Mutter frame APIs |

### Known Limitations
- Wayland requires a user session logout/login on initial installation so GNOME Shell discovers newly added extension directories in `~/.local/share/gnome-shell/extensions/`.
- Fullscreen applications temporarily suspend tiling for that window until restored.

---

## Installation

### Method 1: One-Command Installation (Git Clone)

Clone the repository and run the installation script:

```bash
git clone https://github.com/lewiskirega/fedora-autotile.git
cd fedora-autotile
./scripts/install.sh
```

### Method 2: Download Release ZIP (No Git Required)

Download and install the latest published release without cloning the repository:

```bash
# 1. Download release archive and checksums
curl -fL -o fedora-autotile.zip \
  https://github.com/lewiskirega/fedora-autotile/releases/latest/download/fedora-autotile.zip
curl -fL -o SHA256SUMS.txt \
  https://github.com/lewiskirega/fedora-autotile/releases/latest/download/SHA256SUMS.txt

# 2. Verify SHA256 checksum
grep "fedora-autotile\.zip" SHA256SUMS.txt | sha256sum -c -

# 3. Extract and install into GNOME extensions directory
mkdir -p ~/.local/share/gnome-shell/extensions/fedora-autotile@codefort.dev
unzip -q fedora-autotile.zip -d ~/.local/share/gnome-shell/extensions/fedora-autotile@codefort.dev

# 4. Compile GSettings schemas
glib-compile-schemas --strict ~/.local/share/gnome-shell/extensions/fedora-autotile@codefort.dev/schemas
```

### Method 3: Installation from Source

```bash
git clone https://github.com/lewiskirega/fedora-autotile.git
cd fedora-autotile
make install
```

---

## Enabling & Opening Preferences

### Enable the Extension
```bash
gnome-extensions enable fedora-autotile@codefort.dev
```

*(Note: Under Wayland, if GNOME Shell was running before the extension was placed on disk, please log out and log back in once).*

### Open Preferences
```bash
gnome-extensions prefs fedora-autotile@codefort.dev
```
Or open the GNOME **Extensions** app and click the settings cog next to **Fedora AutoTile**.

---

## Updating

Update to the latest release safely with verified checksums:

```bash
./scripts/update.sh
```
Or via Makefile:
```bash
make update
```

User preferences in GSettings are automatically preserved during updates.

---

## Uninstallation

To uninstall Fedora AutoTile while keeping your preferences intact:

```bash
./scripts/uninstall.sh
```

To completely remove the extension and reset all preferences to default:

```bash
./scripts/uninstall.sh --reset-settings
```
Or via Makefile:
```bash
make uninstall
```

---

## Troubleshooting

### 1. Check GNOME Shell Version
```bash
gnome-shell --version
```
Ensure your version is GNOME 50 or 51+.

### 2. Verify Extension Status
```bash
gnome-extensions info fedora-autotile@codefort.dev
```

### 3. Inspect Extension Logs
View live journal logs for Fedora AutoTile:
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep -i autotile
```

### 4. Emergency Disable
If an misbehaving application causes an issue, disable automatic tiling using the top panel switch, via keyboard (`Super + Y`), or via terminal:
```bash
gnome-extensions disable fedora-autotile@codefort.dev
```

### 5. Reporting Issues
Please report issues and feature requests through our [GitHub Issues](https://github.com/lewiskirega/fedora-autotile/issues) using our structured templates.

---

## Development & Contributing

We welcome contributions! Please review [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

### Quick Developer Setup
```bash
# Clone repository
git clone https://github.com/lewiskirega/fedora-autotile.git
cd fedora-autotile

# Validate syntax and schemas
make check

# Run automated unit tests in Node and GJS
make test

# Install developer build
make dev-install

# Build release packages
make release
```

---

## License

Fedora AutoTile is licensed under the [GNU General Public License v3.0](LICENSE).
