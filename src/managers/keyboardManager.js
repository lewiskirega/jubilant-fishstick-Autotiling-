/**
 * Fedora AutoTile - Keyboard Manager
 * Registers and unregisters native GNOME Shell keybindings via Main.wm.addKeybinding.
 */

import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class KeyboardManager {
    /**
     * @param {object} params
     * @param {Gio.Settings} params.settings
     * @param {object} params.tilingEngine
     */
    constructor({ settings, tilingEngine }) {
        this._settings = settings;
        this._tilingEngine = tilingEngine;
        this._registeredBindings = [];
    }

    /**
     * Register all keyboard shortcuts
     */
    enable() {
        if (!this._settings || !Main.wm) return;

        const bindings = [
            {
                name: 'toggle-tiling',
                handler: () => {
                    const current = this._tilingEngine.isEnabled();
                    this._tilingEngine.setEnabled(!current);
                    this._settings.set_boolean('enable-tiling', !current);
                }
            },
            {
                name: 'focus-left',
                handler: () => this._tilingEngine.focusDirection('left')
            },
            {
                name: 'focus-right',
                handler: () => this._tilingEngine.focusDirection('right')
            },
            {
                name: 'focus-up',
                handler: () => this._tilingEngine.focusDirection('up')
            },
            {
                name: 'focus-down',
                handler: () => this._tilingEngine.focusDirection('down')
            },
            {
                name: 'move-left',
                handler: () => this._tilingEngine.swapDirection('left')
            },
            {
                name: 'move-right',
                handler: () => this._tilingEngine.swapDirection('right')
            },
            {
                name: 'move-up',
                handler: () => this._tilingEngine.swapDirection('up')
            },
            {
                name: 'move-down',
                handler: () => this._tilingEngine.swapDirection('down')
            },
            {
                name: 'toggle-floating',
                handler: () => this._tilingEngine.toggleFloatingForFocused()
            },
            {
                name: 'cycle-layout',
                handler: () => this._tilingEngine.cycleLayout()
            },
            {
                name: 'increase-window-size',
                handler: () => this._tilingEngine.adjustFocusedWindowSize(0.05)
            },
            {
                name: 'decrease-window-size',
                handler: () => this._tilingEngine.adjustFocusedWindowSize(-0.05)
            },
            {
                name: 'move-to-workspace-up',
                handler: () => this._moveWindowToWorkspace(-1)
            },
            {
                name: 'move-to-workspace-down',
                handler: () => this._moveWindowToWorkspace(1)
            },
            {
                name: 'move-to-monitor-left',
                handler: () => this._moveWindowToMonitor(-1)
            },
            {
                name: 'move-to-monitor-right',
                handler: () => this._moveWindowToMonitor(1)
            }
        ];

        for (const b of bindings) {
            try {
                Main.wm.addKeybinding(
                    b.name,
                    this._settings,
                    Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
                    Shell.ActionMode.NORMAL,
                    b.handler
                );
                this._registeredBindings.push(b.name);
            } catch (e) {
                console.warn(`[Fedora AutoTile] Failed to bind ${b.name}: ${e.message}`);
            }
        }
    }

    /**
     * Unregister all keybindings
     */
    disable() {
        if (!Main.wm) return;

        for (const name of this._registeredBindings) {
            try {
                Main.wm.removeKeybinding(name);
            } catch {
                // Ignore errors during removal
            }
        }
        this._registeredBindings = [];
    }

    _moveWindowToWorkspace(delta) {
        const display = global.display;
        const win = display?.get_focus_window();
        if (!win) return;

        const wsManager = global.workspace_manager;
        if (!wsManager) return;

        const curIdx = wsManager.get_active_workspace_index();
        const nWorkspaces = wsManager.get_n_workspaces();
        const targetIdx = curIdx + delta;

        if (targetIdx >= 0 && targetIdx < nWorkspaces) {
            const targetWs = wsManager.get_workspace_by_index(targetIdx);
            if (targetWs) {
                win.change_workspace(targetWs);
                targetWs.activate_with_focus(win, global.get_current_time());
            }
        }
    }

    _moveWindowToMonitor(delta) {
        const display = global.display;
        const win = display?.get_focus_window();
        if (!win) return;

        const curMon = win.get_monitor();
        const nMonitors = display.get_n_monitors();
        const targetMon = (curMon + delta + nMonitors) % nMonitors;

        if (targetMon !== curMon) {
            win.move_to_monitor(targetMon);
            this._tilingEngine.reflowNow();
        }
    }
}

