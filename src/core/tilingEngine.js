/**
 * Fedora AutoTile - Tiling Engine Core
 * Coordinates layout calculations, applies window geometry changes safely,
 * and handles debouncing and re-entrancy prevention.
 */

import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import { Rectangle } from './geometry.js';

export class TilingEngine {
    /**
     * @param {object} params
     * @param {object} params.settings
     * @param {object} params.layoutFactory
     * @param {object} params.workspaceManager
     * @param {object} params.monitorManager
     * @param {object} params.floatingManager
     * @param {object} params.windowTracker
     */
    constructor({
        settings,
        layoutFactory,
        workspaceManager,
        monitorManager,
        floatingManager,
        windowTracker
    }) {
        this._settings = settings;
        this._layoutFactory = layoutFactory;
        this._workspaceManager = workspaceManager;
        this._monitorManager = monitorManager;
        this._floatingManager = floatingManager;
        this._windowTracker = windowTracker;

        this._enabled = true;
        this._isReflowing = false;
        this._reflowScheduled = false;
        this._idleSourceId = 0;

        // Workspace-specific ordered window lists (for swapping & master-stack ordering)
        this._windowOrder = new Map(); // key: `${wsIndex}-${monIndex}` -> Array<Meta.Window>
    }

    /**
     * Start the engine
     */
    enable() {
        this._enabled = this._settings?.get_boolean('enable-tiling') ?? true;
        this._scheduleReflow();
    }

    /**
     * Stop the engine and untile windows
     */
    disable() {
        this._cancelScheduledReflow();
        this._enabled = false;

        // Restore windows to their pre-tiled positions
        if (this._windowTracker) {
            for (const state of this._windowTracker.getAllStates()) {
                state.restoreOriginalGeometry();
            }
        }
        this._windowOrder.clear();
    }

    /**
     * Set enabled state
     * @param {boolean} val
     */
    setEnabled(val) {
        if (this._enabled === val) return;
        this._enabled = val;
        if (this._enabled) {
            this._scheduleReflow();
        } else {
            this.disable();
        }
    }

    isEnabled() {
        return this._enabled;
    }

    /**
     * Schedule a debounced reflow pass
     */
    scheduleReflow() {
        this._scheduleReflow();
    }

    _scheduleReflow() {
        if (!this._enabled || this._reflowScheduled) return;

        this._reflowScheduled = true;
        this._cancelScheduledReflow();

        this._idleSourceId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._reflowScheduled = false;
            this._idleSourceId = 0;
            this.reflowNow();
            return GLib.SOURCE_REMOVE;
        });
    }

    _cancelScheduledReflow() {
        if (this._idleSourceId > 0) {
            GLib.source_remove(this._idleSourceId);
            this._idleSourceId = 0;
        }
    }

    /**
     * Get current gap settings
     * @returns {{inner: number, outer: number, horizontal: number, vertical: number}}
     */
    getGaps() {
        if (!this._settings) {
            return { inner: 8, outer: 8, horizontal: 8, vertical: 8 };
        }
        try {
            const inner = this._settings.get_int('inner-gap');
            const outer = this._settings.get_int('outer-gap');
            const horizontal = this._settings.get_int('horizontal-gap');
            const vertical = this._settings.get_int('vertical-gap');
            return {
                inner: inner > 0 ? inner : 8,
                outer: outer >= 0 ? outer : 8,
                horizontal: horizontal > 0 ? horizontal : inner,
                vertical: vertical > 0 ? vertical : inner
            };
        } catch {
            return { inner: 8, outer: 8, horizontal: 8, vertical: 8 };
        }
    }

    /**
     * Execute an immediate layout pass across active workspaces and monitors
     */
    reflowNow() {
        if (!this._enabled || this._isReflowing) return;
        this._isReflowing = true;

        try {
            const display = global.display;
            if (!display) return;

            const workspaceManager = global.workspace_manager;
            if (!workspaceManager) return;

            const activeWorkspace = workspaceManager.get_active_workspace();
            if (!activeWorkspace) return;

            const wsIndex = activeWorkspace.index();
            const monitorCount = this._monitorManager.getMonitorCount();
            const gaps = this.getGaps();

            for (let mon = 0; mon < monitorCount; mon++) {
                this._reflowWorkspaceMonitor(activeWorkspace, wsIndex, mon, gaps);
            }
        } catch (e) {
            console.error(`[Fedora AutoTile] Error during reflow: ${e.message}`, e);
        } finally {
            this._isReflowing = false;
        }
    }

    /**
     * Reflow windows on a specific workspace and monitor
     */
    _reflowWorkspaceMonitor(workspace, wsIndex, monIndex, gaps) {
        const rawWindows = this._windowTracker.getTileableWindows(workspace, monIndex);
        if (rawWindows.length === 0) return;

        const orderKey = `${wsIndex}-${monIndex}`;
        let ordered = this._windowOrder.get(orderKey) || [];

        // Synchronize ordered list with currently valid raw windows
        ordered = ordered.filter(w => rawWindows.includes(w));
        for (const w of rawWindows) {
            if (!ordered.includes(w)) {
                ordered.push(w);
            }
        }
        this._windowOrder.set(orderKey, ordered);

        const workArea = this._monitorManager.getWorkArea(workspace, monIndex);
        const layoutId = this._workspaceManager.getLayout(
            workspace,
            this._settings?.get_string('default-layout') ?? 'dynamic-grid'
        );
        const layout = this._layoutFactory.getLayout(layoutId);

        // Prepare window descriptors with min sizes
        const descriptors = ordered.map(w => {
            const state = this._windowTracker.getWindowState(w);
            const minSize = state ? state.getMinSize() : { minWidth: 100, minHeight: 100 };
            return {
                metaWindow: w,
                id: w.get_id ? w.get_id() : w,
                minWidth: minSize.minWidth,
                minHeight: minSize.minHeight
            };
        });

        // Compute geometry
        const placements = layout.calculateLayout(workArea, descriptors, gaps);

        // Apply geometry changes safely
        for (const [desc, targetRect] of placements.entries()) {
            const win = desc.metaWindow;
            this._applyWindowGeometry(win, targetRect);
        }
    }

    /**
     * Safely apply target rectangle to a Meta.Window
     */
    _applyWindowGeometry(win, rect) {
        if (!win || typeof win.move_resize_frame !== 'function') return;

        try {
            // Unmaximize if window was maximized
            if (win.get_maximized && win.get_maximized() !== 0) {
                win.unmaximize(Meta.MaximizeFlags.BOTH);
            }

            // Check current frame to avoid unnecessary jitter
            if (win.get_frame_rect) {
                const cur = win.get_frame_rect();
                if (Math.abs(cur.x - rect.x) <= 2 &&
                    Math.abs(cur.y - rect.y) <= 2 &&
                    Math.abs(cur.width - rect.width) <= 2 &&
                    Math.abs(cur.height - rect.height) <= 2) {
                    return; // Already in place
                }
            }

            // Apply move and resize
            win.move_resize_frame(false, rect.x, rect.y, rect.width, rect.height);
        } catch (e) {
            console.error(`[Fedora AutoTile] Failed to move window: ${e.message}`);
        }
    }

    /**
     * Focus window in a cardinal direction (left, right, up, down)
     * @param {'left'|'right'|'up'|'down'} direction
     */
    focusDirection(direction) {
        const display = global.display;
        if (!display) return;

        const currentFocus = display.get_focus_window();
        if (!currentFocus) return;

        const currentRect = currentFocus.get_frame_rect();
        const currentCenter = {
            x: currentRect.x + (currentRect.width / 2),
            y: currentRect.y + (currentRect.height / 2)
        };

        const activeWs = global.workspace_manager?.get_active_workspace();
        if (!activeWs) return;

        const monIndex = currentFocus.get_monitor();
        const tileable = this._windowTracker.getTileableWindows(activeWs, monIndex);

        let bestCandidate = null;
        let shortestDist = Infinity;

        for (const win of tileable) {
            if (win === currentFocus) continue;
            const r = win.get_frame_rect();
            const center = {
                x: r.x + (r.width / 2),
                y: r.y + (r.height / 2)
            };

            const dx = center.x - currentCenter.x;
            const dy = center.y - currentCenter.y;

            let isDirectional = false;
            switch (direction) {
                case 'left':  isDirectional = dx < -10; break;
                case 'right': isDirectional = dx > 10; break;
                case 'up':    isDirectional = dy < -10; break;
                case 'down':  isDirectional = dy > 10; break;
            }

            if (isDirectional) {
                const dist = Math.hypot(dx, dy);
                if (dist < shortestDist) {
                    shortestDist = dist;
                    bestCandidate = win;
                }
            }
        }

        if (bestCandidate && typeof bestCandidate.focus === 'function') {
            bestCandidate.focus(global.get_current_time());
        }
    }

    /**
     * Swap window with adjacent window in a cardinal direction
     * @param {'left'|'right'|'up'|'down'} direction
     */
    swapDirection(direction) {
        const display = global.display;
        if (!display) return;

        const currentFocus = display.get_focus_window();
        if (!currentFocus) return;

        const activeWs = global.workspace_manager?.get_active_workspace();
        if (!activeWs) return;

        const wsIndex = activeWs.index();
        const monIndex = currentFocus.get_monitor();
        const orderKey = `${wsIndex}-${monIndex}`;
        let ordered = this._windowOrder.get(orderKey) || [];

        const currentIdx = ordered.indexOf(currentFocus);
        if (currentIdx === -1 || ordered.length <= 1) return;

        let targetIdx = -1;
        if (direction === 'left' || direction === 'up') {
            targetIdx = currentIdx > 0 ? currentIdx - 1 : ordered.length - 1;
        } else {
            targetIdx = currentIdx < ordered.length - 1 ? currentIdx + 1 : 0;
        }

        if (targetIdx !== -1 && targetIdx !== currentIdx) {
            // Swap in ordered array
            const temp = ordered[currentIdx];
            ordered[currentIdx] = ordered[targetIdx];
            ordered[targetIdx] = temp;
            this._windowOrder.set(orderKey, ordered);
            this.reflowNow();
        }
    }

    /**
     * Toggle floating mode for currently focused window
     */
    toggleFloatingForFocused() {
        const display = global.display;
        if (!display) return;

        const currentFocus = display.get_focus_window();
        if (!currentFocus) return;

        const isNowFloating = this._floatingManager.toggleFloat(currentFocus);
        if (isNowFloating) {
            // Restore original geometry or center on screen
            const state = this._windowTracker.getWindowState(currentFocus);
            if (state) state.restoreOriginalGeometry();
        }
        this.reflowNow();
    }

    /**
     * Cycle active workspace to the next layout
     * @returns {string} New layout ID
     */
    cycleLayout() {
        const activeWs = global.workspace_manager?.get_active_workspace();
        if (!activeWs) return 'dynamic-grid';

        const currentLayout = this._workspaceManager.getLayout(activeWs);
        const nextLayout = this._layoutFactory.getNextLayoutId(currentLayout);
        this._workspaceManager.setLayout(activeWs, nextLayout);
        this.reflowNow();
        return nextLayout;
    }
}

