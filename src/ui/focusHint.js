/**
 * Fedora AutoTile - Active Window Focus Hint
 * Renders a crisp highlight border around the currently focused tiled window,
 * giving instant visual feedback inspired by Pop Shell.
 */

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export const FocusHint = GObject.registerClass({
    GTypeName: 'FedoraAutoTileFocusHint',
}, class FocusHint extends St.Widget {
    _init({ settings, windowTracker }) {
        super._init({
            style_class: 'fedora-autotile-focus-hint',
            can_focus: false,
            reactive: false,
        });

        this._settings = settings;
        this._windowTracker = windowTracker;
        this._trackedWindow = null;
        this._windowSignals = [];
        this._displaySignals = [];

        this.hide();
        Main.uiGroup.add_child(this);

        this._connectSignals();
        this._updateStyles();
        this.updatePosition();
    }

    _connectSignals() {
        const display = global.display;
        if (display && typeof display.connect === 'function') {
            const focusId = display.connect('notify::focus-window', () => {
                this.updatePosition();
            });
            const restackId = display.connect('restacked', () => {
                this.updatePosition();
            });
            this._displaySignals.push(focusId, restackId);
        }

        if (this._settings) {
            const styleKeys = ['show-active-hint', 'active-hint-color', 'active-hint-border-width'];
            for (const key of styleKeys) {
                const sigId = this._settings.connect(`changed::${key}`, () => {
                    this._updateStyles();
                    this.updatePosition();
                });
                this._displaySignals.push(sigId);
            }
        }
    }

    _updateStyles() {
        if (!this._settings) return;

        const color = this._settings.get_string('active-hint-color') || '#3584e4';
        const borderWidth = this._settings.get_int('active-hint-border-width') || 2;
        const radius = Math.max(4, borderWidth * 2);

        this.set_style(
            `border: ${borderWidth}px solid ${color}; ` +
            `border-radius: ${radius}px; ` +
            `background-color: transparent;`
        );
    }

    updatePosition() {
        const isEnabled = this._settings?.get_boolean('show-active-hint') ?? true;
        if (!isEnabled) {
            this.hide();
            return;
        }

        const display = global.display;
        const win = display?.get_focus_window();

        if (!win || (typeof win.is_alive === 'function' && !win.is_alive())) {
            this._detachFromWindow();
            this.hide();
            return;
        }

        // Only show hint on tileable windows (not dialogs, modals or floating apps)
        const activeWs = global.workspace_manager?.get_active_workspace();
        if (!activeWs || (typeof win.located_on_workspace === 'function' && !win.located_on_workspace(activeWs))) {
            this._detachFromWindow();
            this.hide();
            return;
        }

        const state = this._windowTracker?.getWindowState(win);
        if (!state) {
            this._detachFromWindow();
            this.hide();
            return;
        }

        if (this._trackedWindow !== win) {
            this._attachToWindow(win);
        }

        const rect = win.get_frame_rect();
        const borderWidth = this._settings?.get_int('active-hint-border-width') ?? 2;

        // Position slightly outside window boundary for clean outline
        this.set_position(rect.x - borderWidth, rect.y - borderWidth);
        this.set_size(rect.width + (borderWidth * 2), rect.height + (borderWidth * 2));
        this.show();

        // Keep hint immediately below popups/panels but above normal windows
        Main.uiGroup.set_child_above_sibling(this, null);
    }

    _attachToWindow(win) {
        this._detachFromWindow();
        this._trackedWindow = win;

        if (typeof win.connect === 'function') {
            const sizeId = win.connect('size-changed', () => this.updatePosition());
            const posId = win.connect('position-changed', () => this.updatePosition());
            const unmanId = win.connect('unmanaged', () => {
                this._detachFromWindow();
                this.hide();
            });
            this._windowSignals.push(sizeId, posId, unmanId);
        }
    }

    _detachFromWindow() {
        if (this._trackedWindow && typeof this._trackedWindow.disconnect === 'function') {
            for (const id of this._windowSignals) {
                try {
                    this._trackedWindow.disconnect(id);
                } catch {
                    // Ignore errors during window destruction
                }
            }
        }
        this._trackedWindow = null;
        this._windowSignals = [];
    }

    destroy() {
        this._detachFromWindow();

        const display = global.display;
        if (display && typeof display.disconnect === 'function') {
            for (const id of this._displaySignals) {
                try {
                    display.disconnect(id);
                } catch {
                    // Ignore disconnect errors
                }
            }
        }
        this._displaySignals = [];

        super.destroy();
    }
});

