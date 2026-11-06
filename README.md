# Fedora AutoTile — Pop Shell Alternative for Modern GNOME

**Fedora AutoTile** is a native GNOME Shell extension inspired by Pop Shell's automatic tiling and keyboard-driven window management, engineered from the ground up for modern GNOME (GNOME 50, GNOME 51+), GJS ES modules, Mutter, Wayland, and Libadwaita.

---

## Features

- **Dynamic Grid Automatic Tiling (Default)**: Automatically tiles newly opened windows into a balanced, proportional grid and dynamically reflows remaining windows when applications close.
- **5 Layout Engines**:
  1. **Dynamic Grid** (Default): Responsive aspect-ratio aware binary/proportional grid.
  2. **Master & Stack**: Primary focus window with vertically stacked secondary windows.
  3. **Horizontal Split**: Equal vertical columns side-by-side.
  4. **Vertical Split**: Equal horizontal rows stacked top-to-bottom.
  5. **Adaptive Grid**: Adapts dynamically for standard and ultrawide displays (3-column center-master).
- **Multi-Monitor Support**: Each monitor maintains an independent tiling context and work area.
- **Per-Workspace Isolation**: Workspaces preserve their own tiling arrangements, layout choices, and window order.
- **Intelligent Floating Window Management**:
  - Automatically excludes dialogs, modals, transients, preferences, and fixed-size windows.
  - Matches application IDs and WM classes against a customizable exception list.
  - One-key toggle between floating and tiled mode (`Super + G`).
- **Configurable Window Gaps**:
  - Inner gaps, outer screen-edge margins, horizontal spacing, and vertical spacing.
- **Top Panel Quick Menu Indicator**:
  - Master toggle switch.
  - Current layout indicator and live switcher.
  - Quick access to settings.
- **GTK4 / Libadwaita Preferences**: Clean, modern GNOME settings window.
- **Wayland-Native & Clean Lifecycle**:
  - Pure GJS ESM.
  - Re-entrancy guards and idle debouncing to prevent feedback loops.
  - Complete signal cleanup on extension disable or window close.
  - Restores original window positions upon untile or extension disable.

---

## Keyboard Shortcuts

All shortcuts are registered natively via GNOME Shell's `Main.wm.addKeybinding` and are fully customizable in GSettings / Preferences:

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
| **Toggle Window Floating Mode** | `Super + G` |
| **Cycle Layout Strategy** | `Super + Space` |
| **Move to Previous Workspace** | `Super + Alt + Up` |
| **Move to Next Workspace** | `Super + Alt + Down` |
| **Move to Left Monitor** | `Super + Ctrl + Left` |
| **Move to Right Monitor** | `Super + Ctrl + Right` |

---

## Architecture

```
fedora-autotile/
├── metadata.json                                          # Extension metadata (GNOME 50/51)
├── extension.js                                           # Main extension entrypoint (ESM)
├── prefs.js                                               # Libadwaita preferences window
├── stylesheet.css                                         # Panel styling
├── schemas/
│   └── org.gnome.shell.extensions.fedora-autotile.gschema.xml
├── src/
│   ├── core/
│   │   ├── geometry.js                                    # Pure rectangle math, gaps & clamping
│   │   ├── windowState.js                                 # Window metadata, original geometry & signal tracking
│   │   ├── windowTracker.js                               # Display signal observer & window filtering
│   │   └── tilingEngine.js                                # Debounced tiling coordinator & reflow engine
│   ├── layouts/
│   │   ├── grid.js                                        # Dynamic Grid algorithm
│   │   ├── masterStack.js                                 # Master & Stack algorithm
│   │   ├── horizontal.js                                  # Horizontal Split algorithm
│   │   ├── vertical.js                                    # Vertical Split algorithm
│   │   ├── adaptive.js                                    # Adaptive / Ultrawide algorithm
│   │   └── layoutFactory.js                               # Layout registry & switcher
│   ├── managers/
│   │   ├── workspaceManager.js                            # Per-workspace layout & context isolation
│   │   ├── monitorManager.js                              # Multi-monitor work area discovery
│   │   ├── keyboardManager.js                             # GSettings-backed keybinding manager
│   │   └── floatingManager.js                             # Application floating rules & overrides
│   ├── ui/
│   │   └── panelIndicator.js                              # Top bar panel indicator & popup menu
│   └── compatibility/
│       └── gnome51.js                                     # GNOME 50/51 API version abstractions
├── tests/
│   ├── testGridLayout.js                                  # Automated tests for dynamic grid
│   ├── testAllLayouts.js                                  # Automated tests for all 5 layouts
│   └── testFloatingRules.js                               # Automated tests for floating rules
└── scripts/
    ├── build.sh                                           # Schema compiler & syntax checker
    ├── test.sh                                            # Multi-runtime test runner (Node & GJS)
    ├── install.sh                                         # User extension directory installer
    ├── uninstall.sh                                       # Clean uninstaller
    ├── pack.sh                                            # ZIP package generator
    └── dev.sh                                             # Developer utility script
```

---

## Installation

### Prerequisites
- Fedora Workstation (or any modern Linux distribution with GNOME 50 or 51)
- Wayland session
- `gjs` (>= 1.80)
- `glib2-devel` (`glib-compile-schemas`)

### Quick Install
To install into your user extensions directory (`~/.local/share/gnome-shell/extensions/fedora-autotile@fedoraproject.org`):

```bash
bash scripts/install.sh
```

Then enable the extension:
```bash
gnome-extensions enable fedora-autotile@fedoraproject.org
```

*Note: On Wayland, if GNOME Shell has not loaded user extensions yet in this session, log out and log back in once.*

### Build & Package Distribution ZIP
```bash
bash scripts/pack.sh
```
This produces `fedora-autotile@fedoraproject.org.shell-extension.zip`.

---

## Automated Testing

Run the test suite across both Node.js and native GJS:

```bash
bash scripts/test.sh
```

All 3 automated test suites execute with 100% pass rates:
1. **Dynamic Grid Calculations**: Single, dual, triple, 2x2, portrait screen aspect ratios, gap arithmetic, and minimum size constraints.
2. **Layout Factory & All 5 Layouts**: Verifies geometry calculations and seamless layout cycling across Dynamic Grid, Master & Stack, Horizontal Split, Vertical Split, and Adaptive Grid.
3. **Floating Rules & Exception Matcher**: Verifies automatic floating for dialogs, modals, transients, fixed-size windows, app ID matching, and manual float toggling.
