/**
 * Fedora AutoTile - Floating Manager
 * Manages floating exceptions, window types, and manual float overrides.
 */

// Default application identifiers that should float automatically
export const DEFAULT_FLOATING_CLASSES = [
    'gnome-calculator',
    'org.gnome.Calculator',
    'org.gnome.clocks',
    'org.gnome.Calendar',
    'org.gnome.NautilusPreviewer',
    'gnome-control-center',
    'org.gnome.Settings',
    'pavucontrol',
    'nm-connection-editor',
    'gcr-prompter',
    'polkit-gnome-authentication-agent-1',
    'Gcr-viewer',
    'ExtensionPreferences',
    'fedora-autotile-prefs'
];

export class FloatingManager {
    /**
     * @param {object} [settings] - Optional GSettings wrapper
     */
    constructor(settings = null) {
        this._settings = settings;
        this._manualFloats = new Set(); // Set of window identifiers manually set to float
        this._cachedExceptions = [...DEFAULT_FLOATING_CLASSES];
        this._reloadExceptions();
    }

    _reloadExceptions() {
        if (!this._settings) return;
        try {
            const userList = this._settings.get_strv('floating-applications');
            if (userList && userList.length > 0) {
                this._cachedExceptions = [...new Set([...DEFAULT_FLOATING_CLASSES, ...userList])];
            }
        } catch {
            // Keep default exceptions if settings not yet loaded
        }
    }

    /**
     * Set GSettings instance
     * @param {object} settings
     */
    setSettings(settings) {
        this._settings = settings;
        this._reloadExceptions();
    }

    /**
     * Determine if a window descriptor or MetaWindow should float
     * @param {object} win - Window descriptor or Meta.Window
     * @returns {boolean} True if window should float
     */
    shouldFloat(win) {
        if (!win) return true;

        const id = win.get_id ? win.get_id() : (win.id ?? win);

        // Check manual override first
        if (this._manualFloats.has(id)) {
            return true;
        }

        // Native Meta.Window introspection if running in GNOME Shell
        if (typeof win.get_window_type === 'function') {
            const winType = win.get_window_type();
            // Meta.WindowType: 0 = NORMAL
            if (winType !== 0) {
                return true;
            }

            // Transient or modal windows (dialogs attached to another window)
            if (win.get_transient_for && win.get_transient_for() !== null) {
                return true;
            }
            if (win.is_attached_dialog && win.is_attached_dialog()) {
                return true;
            }

            // Fixed size windows (cannot maximize or resize)
            if (win.can_maximize && !win.can_maximize()) {
                return true;
            }
            if (win.allows_resize && !win.allows_resize()) {
                return true;
            }

            // Min and Max size equality check
            if (win.get_min_size && win.get_max_size) {
                const [hasMin, minW, minH] = win.get_min_size();
                const [hasMax, maxW, maxH] = win.get_max_size();
                if (hasMin && hasMax && minW === maxW && minH === maxH && minW > 0) {
                    return true;
                }
            }
        }

        // Match against WM Class, App ID, and Title
        const wmClass = (win.get_wm_class ? win.get_wm_class() : win.wmClass) ?? '';
        const appId = (win.get_gtk_application_id ? win.get_gtk_application_id() : win.appId) ?? '';
        const title = (win.get_title ? win.get_title() : win.title) ?? '';

        return this._matchesRules(wmClass, appId, title);
    }

    /**
     * Check if strings match configured exceptions
     * @param {string} wmClass
     * @param {string} appId
     * @param {string} title
     * @returns {boolean}
     */
    _matchesRules(wmClass, appId, title) {
        const lowerWm = wmClass.toLowerCase();
        const lowerApp = appId.toLowerCase();
        const lowerTitle = title.toLowerCase();

        for (const rule of this._cachedExceptions) {
            const lowerRule = rule.toLowerCase().trim();
            if (!lowerRule) continue;

            if (lowerWm === lowerRule || lowerWm.includes(lowerRule)) return true;
            if (lowerApp === lowerRule || lowerApp.includes(lowerRule)) return true;
            if (lowerTitle.includes(lowerRule)) return true;
        }

        return false;
    }

    /**
     * Toggle manual floating status for a window
     * @param {object} win
     * @returns {boolean} New floating state
     */
    toggleFloat(win) {
        if (!win) return false;
        const id = win.get_id ? win.get_id() : (win.id ?? win);

        if (this._manualFloats.has(id)) {
            this._manualFloats.delete(id);
            return false; // Now tiled
        } else {
            this._manualFloats.add(id);
            return true; // Now floating
        }
    }

    /**
     * Check if a window is manually floating
     * @param {object} win
     * @returns {boolean}
     */
    isManuallyFloating(win) {
        const id = win.get_id ? win.get_id() : (win.id ?? win);
        return this._manualFloats.has(id);
    }

    /**
     * Clean up state for a destroyed window
     * @param {object} win
     */
    untrack(win) {
        const id = win.get_id ? win.get_id() : (win.id ?? win);
        this._manualFloats.delete(id);
    }

    clear() {
        this._manualFloats.clear();
    }
}
