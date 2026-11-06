/**
 * Fedora AutoTile - Top Panel Status Indicator
 * Provides quick toggle, active layout selector, and settings launcher.
 */

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { AVAILABLE_LAYOUTS } from '../layouts/layoutFactory.js';

export const AutoTileIndicator = GObject.registerClass(
class AutoTileIndicator extends PanelMenu.Button {
    _init({ extension, tilingEngine, workspaceManager, settings }) {
        super._init(0.0, 'Fedora AutoTile');

        this._extension = extension;
        this._tilingEngine = tilingEngine;
        this._workspaceManager = workspaceManager;
        this._settings = settings;

        // Container box for icon
        const box = new St.BoxLayout({ style_class: 'panel-status-indicators-box' });
        this._icon = new St.Icon({
            icon_name: 'view-grid-symbolic',
            style_class: 'system-status-icon'
        });
        box.add_child(this._icon);
        this.add_child(box);

        this._buildMenu();
        this._updateVisualState();
    }

    _buildMenu() {
        this.menu.removeAll();

        // 1. Master Toggle Switch
        const toggleItem = new PopupMenu.PopupSwitchMenuItem(
            'Automatic Tiling',
            this._tilingEngine.isEnabled()
        );
        toggleItem.connect('toggled', (item, state) => {
            this._tilingEngine.setEnabled(state);
            this._settings?.set_boolean('enable-tiling', state);
            this._updateVisualState();
        });
        this._toggleItem = toggleItem;
        this.menu.addMenuItem(toggleItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // 2. Layout Section Header
        const layoutHeader = new PopupMenu.PopupMenuItem('Active Layout', {
            reactive: false,
            can_focus: false,
            style_class: 'popup-subtitle-menu-item'
        });
        this.menu.addMenuItem(layoutHeader);

        // 3. Layout Options
        this._layoutItems = new Map();
        const activeWs = global.workspace_manager?.get_active_workspace();
        const currentLayoutId = this._workspaceManager.getLayout(
            activeWs,
            this._settings?.get_string('default-layout') ?? 'dynamic-grid'
        );

        for (const layout of AVAILABLE_LAYOUTS) {
            const item = new PopupMenu.PopupImageMenuItem(layout.label, layout.icon);
            item.connect('activate', () => {
                const ws = global.workspace_manager?.get_active_workspace();
                if (ws) {
                    this._workspaceManager.setLayout(ws, layout.id);
                    this._tilingEngine.reflowNow();
                    this._updateVisualState();
                }
            });
            this._layoutItems.set(layout.id, item);
            this.menu.addMenuItem(item);
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // 4. Preferences Shortcut
        const prefsItem = new PopupMenu.PopupImageMenuItem(
            'Preferences…',
            'emblem-system-symbolic'
        );
        prefsItem.connect('activate', () => {
            this._extension.openPreferences();
        });
        this.menu.addMenuItem(prefsItem);
    }

    _updateVisualState() {
        const isEnabled = this._tilingEngine.isEnabled();
        if (this._toggleItem) {
            this._toggleItem.setToggleState(isEnabled);
        }

        const activeWs = global.workspace_manager?.get_active_workspace();
        const currentLayoutId = this._workspaceManager.getLayout(
            activeWs,
            this._settings?.get_string('default-layout') ?? 'dynamic-grid'
        );

        // Update active checkmarks / styles
        if (this._layoutItems) {
            for (const [id, item] of this._layoutItems.entries()) {
                if (id === currentLayoutId) {
                    item.setOrnament(PopupMenu.Ornament.DOT);
                } else {
                    item.setOrnament(PopupMenu.Ornament.NONE);
                }
            }
        }

        // Update panel icon style
        if (this._icon) {
            this._icon.opacity = isEnabled ? 255 : 120;
            const currentLayout = AVAILABLE_LAYOUTS.find(l => l.id === currentLayoutId);
            if (currentLayout) {
                this._icon.icon_name = currentLayout.icon;
            }
        }
    }
});
