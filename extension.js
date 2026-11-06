/**
 * Fedora AutoTile - Main Extension Entrypoint (GNOME 50 & 51 ESM)
 */

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { LayoutFactory } from './src/layouts/layoutFactory.js';
import { WorkspaceManager } from './src/managers/workspaceManager.js';
import { MonitorManager } from './src/managers/monitorManager.js';
import { FloatingManager } from './src/managers/floatingManager.js';
import { WindowTracker } from './src/core/windowTracker.js';
import { TilingEngine } from './src/core/tilingEngine.js';
import { KeyboardManager } from './src/managers/keyboardManager.js';
import { AutoTileIndicator } from './src/ui/panelIndicator.js';

export default class FedoraAutoTileExtension extends Extension {
    enable() {
        console.log(`[Fedora AutoTile] Enabling extension ${this.uuid}...`);

        this._settings = this.getSettings();
        this._settingsSignals = [];
        this._globalSignals = [];

        // 1. Core Services & Managers
        this._layoutFactory = new LayoutFactory();
        this._workspaceManager = new WorkspaceManager();
        this._monitorManager = new MonitorManager(global.display);
        this._floatingManager = new FloatingManager(this._settings);

        // 2. Window Tracker
        this._windowTracker = new WindowTracker({
            display: global.display,
            workspaceManager: this._workspaceManager,
            floatingManager: this._floatingManager,
            onWindowsChanged: () => {
                this._tilingEngine?.scheduleReflow();
            }
        });

        // 3. Tiling Engine
        this._tilingEngine = new TilingEngine({
            settings: this._settings,
            layoutFactory: this._layoutFactory,
            workspaceManager: this._workspaceManager,
            monitorManager: this._monitorManager,
            floatingManager: this._floatingManager,
            windowTracker: this._windowTracker
        });

        // 4. Keyboard Shortcuts Manager
        this._keyboardManager = new KeyboardManager({
            settings: this._settings,
            tilingEngine: this._tilingEngine
        });

        // 5. Top Panel Indicator
        try {
            this._indicator = new AutoTileIndicator({
                extension: this,
                tilingEngine: this._tilingEngine,
                workspaceManager: this._workspaceManager,
                settings: this._settings
            });
            Main.panel.addToStatusArea('fedora-autotile-indicator', this._indicator);
        } catch (e) {
            console.error(`[Fedora AutoTile] Failed to add panel indicator: ${e.message}`, e);
        }

        // 6. Connect Settings Signals
        this._connectSettingsSignals();

        // 7. Connect Global Shell & Display Signals
        this._connectGlobalSignals();

        // 8. Activate Everything
        this._windowTracker.enable();
        this._keyboardManager.enable();
        this._tilingEngine.enable();

        console.log(`[Fedora AutoTile] Extension ${this.uuid} enabled successfully.`);
    }

    disable() {
        console.log(`[Fedora AutoTile] Disabling extension ${this.uuid}...`);

        // 1. Disconnect Settings Signals
        if (this._settings) {
            for (const id of this._settingsSignals) {
                try {
                    this._settings.disconnect(id);
                } catch {
                    // Ignore disconnect errors during teardown
                }
            }
            this._settingsSignals = [];
        }

        // 2. Disconnect Global Shell Signals
        for (const { target, id } of this._globalSignals) {
            try {
                target.disconnect(id);
            } catch {
                // Ignore disconnect errors during teardown
            }
        }
        this._globalSignals = [];

        // 3. Disable Managers & Restore Windows
        this._keyboardManager?.disable();
        this._windowTracker?.disable();
        this._tilingEngine?.disable();

        // 4. Remove Panel Indicator
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        // 5. Clean References
        this._layoutFactory = null;
        this._workspaceManager = null;
        this._monitorManager = null;
        this._floatingManager = null;
        this._windowTracker = null;
        this._tilingEngine = null;
        this._keyboardManager = null;
        this._settings = null;

        console.log(`[Fedora AutoTile] Extension ${this.uuid} disabled.`);
    }

    _connectSettingsSignals() {
        const gapKeys = ['inner-gap', 'outer-gap', 'horizontal-gap', 'vertical-gap'];
        for (const key of gapKeys) {
            const sigId = this._settings.connect(`changed::${key}`, () => {
                this._tilingEngine?.scheduleReflow();
            });
            this._settingsSignals.push(sigId);
        }

        const enableId = this._settings.connect('changed::enable-tiling', () => {
            const isEnabled = this._settings.get_boolean('enable-tiling');
            this._tilingEngine?.setEnabled(isEnabled);
            this._indicator?._updateVisualState();
        });
        this._settingsSignals.push(enableId);

        const floatId = this._settings.connect('changed::floating-applications', () => {
            this._floatingManager?.setSettings(this._settings);
            this._tilingEngine?.scheduleReflow();
        });
        this._settingsSignals.push(floatId);
    }

    _connectGlobalSignals() {
        const display = global.display;
        if (display && typeof display.connect === 'function') {
            const workAreaId = display.connect('workareas-changed', () => {
                this._tilingEngine?.scheduleReflow();
            });
            this._globalSignals.push({ target: display, id: workAreaId });

            const restackId = display.connect('restacked', () => {
                // Keep ordering responsive when user clicks or activates a window
            });
            this._globalSignals.push({ target: display, id: restackId });
        }

        const wsManager = global.workspace_manager;
        if (wsManager && typeof wsManager.connect === 'function') {
            const wsChangeId = wsManager.connect('active-workspace-changed', () => {
                this._workspaceManager?.setActiveIndex(wsManager.get_active_workspace_index());
                this._indicator?._updateVisualState();
                this._tilingEngine?.scheduleReflow();
            });
            this._globalSignals.push({ target: wsManager, id: wsChangeId });
        }
    }
}
