/**
 * Fedora AutoTile - Window State Container
 * Encapsulates window metadata, original geometry for clean untiling, and signal tracking.
 */

import { Rectangle } from './geometry.js';

export class WindowState {
    /**
     * @param {Meta.Window} metaWindow
     */
    constructor(metaWindow) {
        this.window = metaWindow;
        this.id = metaWindow.get_id ? metaWindow.get_id() : metaWindow;
        this.originalRect = null;
        this.lastTiledRect = null;
        this._signals = [];

        // Save original geometry if available
        if (typeof metaWindow.get_frame_rect === 'function') {
            const frame = metaWindow.get_frame_rect();
            this.originalRect = new Rectangle(frame.x, frame.y, frame.width, frame.height);
        }
    }

    /**
     * Get minimum size constraints
     * @returns {{minWidth: number, minHeight: number}}
     */
    getMinSize() {
        if (typeof this.window.get_min_size === 'function') {
            const [hasMin, minW, minH] = this.window.get_min_size();
            if (hasMin) {
                return { minWidth: minW, minHeight: minH };
            }
        }
        return { minWidth: 100, minHeight: 100 };
    }

    /**
     * Connect a signal and track it for cleanup
     * @param {string} signalName
     * @param {Function} handler
     */
    connectSignal(signalName, handler) {
        if (typeof this.window.connect === 'function') {
            const id = this.window.connect(signalName, handler);
            this._signals.push(id);
            return id;
        }
        return 0;
    }

    /**
     * Disconnect all signals
     */
    disconnectAll() {
        for (const id of this._signals) {
            try {
                if (typeof this.window.disconnect === 'function') {
                    this.window.disconnect(id);
                }
            } catch {
                // Ignore errors during window destruction
            }
        }
        this._signals = [];
    }

    /**
     * Restore original pre-tiling geometry
     */
    restoreOriginalGeometry() {
        if (!this.originalRect || typeof this.window.move_resize_frame !== 'function') {
            return;
        }
        try {
            this.window.move_resize_frame(
                false,
                this.originalRect.x,
                this.originalRect.y,
                this.originalRect.width,
                this.originalRect.height
            );
        } catch {
            // Window might be closed or unmanaged
        }
    }
}

