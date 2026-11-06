/**
 * Fedora AutoTile - Window Tracker
 * Observes display and workspace signals to maintain the collection of tileable windows.
 */

import { WindowState } from './windowState.js';

export class WindowTracker {
    /**
     * @param {object} params
     * @param {Meta.Display} params.display
     * @param {object} params.workspaceManager
     * @param {object} params.floatingManager
     * @param {Function} params.onWindowsChanged - Callback when window set changes
     */
    constructor({ display, workspaceManager, floatingManager, onWindowsChanged }) {
        this._display = display;
        this._workspaceManager = workspaceManager;
        this._floatingManager = floatingManager;
        this._onWindowsChanged = onWindowsChanged;

        // Map from MetaWindow (or window ID) to WindowState
        this._windowStates = new Map();
        this._displaySignals = [];
    }

    /**
     * Start tracking windows
     */
    enable() {
        if (!this._display) return;

        // Connect display-level window lifecycle events
        if (typeof this._display.connect === 'function') {
            const createdId = this._display.connect('window-created', (disp, win) => {
                this._onWindowCreated(win);
            });
            const enteredId = this._display.connect('window-entered-monitor', (disp, mon, win) => {
                this._onWindowMonitorChanged(win, mon);
            });
            const leftId = this._display.connect('window-left-monitor', (disp, mon, win) => {
                this._onWindowMonitorChanged(win, mon);
            });

            this._displaySignals.push(createdId, enteredId, leftId);
        }

        // Track existing windows
        this._scanExistingWindows();
    }

    /**
     * Stop tracking and disconnect all signals
     */
    disable() {
        if (this._display && typeof this._display.disconnect === 'function') {
            for (const sigId of this._displaySignals) {
                try {
                    this._display.disconnect(sigId);
                } catch {
                    // Ignore disconnect errors during teardown
                }
            }
        }
        this._displaySignals = [];

        for (const state of this._windowStates.values()) {
            state.disconnectAll();
        }
        this._windowStates.clear();
    }

    /**
     * Scan currently open windows
     */
    _scanExistingWindows() {
        if (!this._display || typeof this._display.list_all_windows !== 'function') {
            return;
        }

        const windows = this._display.list_all_windows();
        for (const win of windows) {
            this._onWindowCreated(win, false);
        }
        this._notifyChanged();
    }

    /**
     * Handle new window creation
     * @param {Meta.Window} win
     * @param {boolean} triggerReflow
     */
    _onWindowCreated(win, triggerReflow = true) {
        if (!win || this._windowStates.has(win)) return;

        // Skip non-normal windows (e.g. desktop, panels, dropdowns)
        if (typeof win.is_override_redirect === 'function' && win.is_override_redirect()) {
            return;
        }

        const state = new WindowState(win);
        this._windowStates.set(win, state);

        // Connect window-level signals
        state.connectSignal('unmanaged', () => {
            this._onWindowDestroyed(win);
        });

        state.connectSignal('notify::minimized', () => {
            this._notifyChanged();
        });

        state.connectSignal('workspace-changed', () => {
            this._notifyChanged();
        });

        if (triggerReflow) {
            this._notifyChanged();
        }
    }

    /**
     * Handle window closure
     * @param {Meta.Window} win
     */
    _onWindowDestroyed(win) {
        const state = this._windowStates.get(win);
        if (state) {
            state.disconnectAll();
            this._windowStates.delete(win);
        }
        this._floatingManager.untrack(win);
        this._notifyChanged();
    }

    /**
     * Handle window moving across monitors
     */
    _onWindowMonitorChanged(win, monIndex) {
        this._notifyChanged();
    }

    /**
     * Get list of tileable windows for a specific workspace and monitor
     * @param {Meta.Workspace} workspace
     * @param {number} monitorIndex
     * @returns {Array<Meta.Window>}
     */
    getTileableWindows(workspace, monitorIndex = 0) {
        const result = [];
        if (!workspace) return result;

        for (const [win, state] of this._windowStates.entries()) {
            // Check if window is still valid and not unmanaged
            if (typeof win.is_alive === 'function' && !win.is_alive()) {
                continue;
            }

            // Check workspace membership
            if (typeof win.located_on_workspace === 'function' && !win.located_on_workspace(workspace)) {
                continue;
            }

            // Check monitor index
            if (typeof win.get_monitor === 'function' && win.get_monitor() !== monitorIndex) {
                continue;
            }

            // Check minimized state
            if (typeof win.is_minimized === 'function' && win.is_minimized()) {
                continue;
            }
            if (win.minimized === true) {
                continue;
            }

            // Check floating rules
            if (this._floatingManager.shouldFloat(win)) {
                continue;
            }

            result.push(win);
        }

        return result;
    }

    /**
     * Get WindowState for a given window
     * @param {Meta.Window} win
     * @returns {WindowState|null}
     */
    getWindowState(win) {
        return this._windowStates.get(win) ?? null;
    }

    /**
     * Get all managed window states
     * @returns {Array<WindowState>}
     */
    getAllStates() {
        return Array.from(this._windowStates.values());
    }

    _notifyChanged() {
        if (typeof this._onWindowsChanged === 'function') {
            this._onWindowsChanged();
        }
    }
}

