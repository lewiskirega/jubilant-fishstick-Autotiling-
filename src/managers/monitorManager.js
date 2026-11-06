/**
 * Fedora AutoTile - Monitor Manager
 * Handles multi-monitor discovery, per-monitor work areas, and geometry updates.
 */

import { Rectangle } from '../core/geometry.js';

export class MonitorManager {
    /**
     * @param {Meta.Display} [display]
     */
    constructor(display = null) {
        this._display = display;
    }

    setDisplay(display) {
        this._display = display;
    }

    /**
     * Get count of active monitors
     * @returns {number}
     */
    getMonitorCount() {
        if (!this._display) return 1;
        return typeof this._display.get_n_monitors === 'function'
            ? this._display.get_n_monitors()
            : 1;
    }

    /**
     * Get primary monitor index
     * @returns {number}
     */
    getPrimaryMonitorIndex() {
        if (!this._display) return 0;
        return typeof this._display.get_primary_monitor === 'function'
            ? this._display.get_primary_monitor()
            : 0;
    }

    /**
     * Get the usable work area for a given workspace and monitor
     * Respects panels, docks, and struts
     * @param {Meta.Workspace} workspace
     * @param {number} monitorIndex
     * @returns {Rectangle}
     */
    getWorkArea(workspace, monitorIndex = 0) {
        if (workspace && typeof workspace.get_work_area_for_monitor === 'function') {
            const rect = workspace.get_work_area_for_monitor(monitorIndex);
            if (rect) {
                return new Rectangle(rect.x, rect.y, rect.width, rect.height);
            }
        }

        if (this._display && typeof this._display.get_monitor_geometry === 'function') {
            const rect = this._display.get_monitor_geometry(monitorIndex);
            if (rect) {
                return new Rectangle(rect.x, rect.y, rect.width, rect.height);
            }
        }

        // Fallback default resolution
        return new Rectangle(0, 0, 1920, 1080);
    }
}
