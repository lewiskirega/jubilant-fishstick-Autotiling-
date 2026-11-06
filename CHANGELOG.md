# Changelog

All notable changes to **Fedora AutoTile** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-06

### Added
- **Dynamic Grid Layout (Default)**: Automatically tiles newly opened windows into a balanced, proportional grid and reflows remaining windows when applications close.
- **5 Layout Engines**:
  - Dynamic Grid (Aspect-ratio aware responsive binary grid).
  - Master & Stack (Primary master window with secondary vertical stack).
  - Horizontal Split (Equal vertical columns).
  - Vertical Split (Equal horizontal rows).
  - Adaptive Grid (Ultrawide 21:9 / 32:9 3-column layout adaptation).
- **Multi-Monitor Support**: Independent per-monitor tiling contexts, work area calculations, and monitor transitions.
- **Per-Workspace Isolation**: Workspaces maintain independent layout state, window order, and arrangements.
- **Floating Application Management**:
  - Automatic exclusion of dialogs, modals, transient windows, settings, and fixed-size windows.
  - Configurable application ID and WM class exception list in GSettings.
  - One-key toggle between floating and tiled mode (`Super + G`).
- **Window Gaps**: Configurable inner, outer, horizontal, and vertical margins in pixels.
- **Top Panel Quick Menu Indicator**: Status indicator with master toggle switch, live layout selector, and settings shortcut.
- **GTK4 / Libadwaita Preferences**: Modern settings window with General, Gaps, Floating Exceptions, Shortcuts, and Maintenance tabs.
- **Keyboard Shortcuts**: Native GNOME Shell keybindings (`Main.wm.addKeybinding`) for directional focus, window swapping, floating toggle, layout cycling, and workspace/monitor moves.
- **Automated Test Suite**: Automated unit tests for geometry arithmetic, dynamic grid layouts, multi-layout engines, and floating rules.
- **Installation & Distribution Scripts**:
  - `scripts/install.sh` supporting local install, local ZIP, and GitHub Releases.
  - `scripts/uninstall.sh` with safe configuration preservation.
  - `scripts/update.sh` with SHA256 verification and atomic updates.
  - `scripts/dev-install.sh` for development.
  - `Makefile` for developer workflow.
  - GitHub Actions CI/CD workflows for testing, release automation, and GNOME compatibility matrices.
