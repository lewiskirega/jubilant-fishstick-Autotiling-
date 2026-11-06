/**
 * Fedora AutoTile - Workspace Manager
 * Tracks independent tiling state, layout type, and window sets per workspace.
 */

export class WorkspaceManager {
    constructor() {
        // Map from workspace index (or workspace object) to { layoutId: string, windowIds: Set }
        this._workspaceData = new Map();
        this._activeWorkspaceIndex = 0;
    }

    /**
     * Get or create workspace context
     * @param {number|object} wsKey - Workspace index or identifier
     * @param {string} defaultLayout - Default layout ID
     * @returns {{layoutId: string, customData: object}}
     */
    getContext(wsKey, defaultLayout = 'dynamic-grid') {
        const key = typeof wsKey === 'object' && wsKey !== null && typeof wsKey.index === 'function'
            ? wsKey.index()
            : wsKey;

        if (!this._workspaceData.has(key)) {
            this._workspaceData.set(key, {
                layoutId: defaultLayout,
                windowIds: new Set()
            });
        }
        return this._workspaceData.get(key);
    }

    /**
     * Set layout for workspace
     * @param {number|object} wsKey
     * @param {string} layoutId
     */
    setLayout(wsKey, layoutId) {
        const ctx = this.getContext(wsKey);
        ctx.layoutId = layoutId;
    }

    /**
     * Get layout for workspace
     * @param {number|object} wsKey
     * @param {string} defaultLayout
     * @returns {string}
     */
    getLayout(wsKey, defaultLayout = 'dynamic-grid') {
        return this.getContext(wsKey, defaultLayout).layoutId;
    }

    /**
     * Set active workspace
     * @param {number} index
     */
    setActiveIndex(index) {
        this._activeWorkspaceIndex = index;
    }

    /**
     * Get active workspace index
     * @returns {number}
     */
    getActiveIndex() {
        return this._activeWorkspaceIndex;
    }

    /**
     * Clear all state
     */
    clear() {
        this._workspaceData.clear();
    }
}
