/**
 * Fedora AutoTile - Modern GTK4 / Libadwaita Preferences Window
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { AVAILABLE_LAYOUTS } from './src/layouts/layoutFactory.js';

export default class FedoraAutoTilePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // -------------------------------------------------------------
        // Page 1: General & Layout
        // -------------------------------------------------------------
        const generalPage = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic'
        });

        const generalGroup = new Adw.PreferencesGroup({
            title: 'Behavior'
        });

        // Master switch
        const enableRow = new Adw.SwitchRow({
            title: 'Enable Automatic Tiling',
            subtitle: 'Automatically tile new windows on managed workspaces'
        });
        settings.bind('enable-tiling', enableRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        generalGroup.add(enableRow);

        // Default layout combo
        const layoutModel = new Gtk.StringList();
        for (const l of AVAILABLE_LAYOUTS) {
            layoutModel.append(l.label);
        }

        const layoutRow = new Adw.ComboRow({
            title: 'Default Layout',
            subtitle: 'Initial layout strategy for new workspaces',
            model: layoutModel
        });

        const currentLayout = settings.get_string('default-layout');
        const activeIdx = AVAILABLE_LAYOUTS.findIndex(l => l.id === currentLayout);
        if (activeIdx >= 0) {
            layoutRow.selected = activeIdx;
        }

        layoutRow.connect('notify::selected', () => {
            const selected = AVAILABLE_LAYOUTS[layoutRow.selected];
            if (selected) {
                settings.set_string('default-layout', selected.id);
            }
        });
        generalGroup.add(layoutRow);
        generalPage.add(generalGroup);

        // -------------------------------------------------------------
        // Page 2: Window Gaps
        // -------------------------------------------------------------
        const gapsPage = new Adw.PreferencesPage({
            title: 'Gaps',
            icon_name: 'view-grid-symbolic'
        });

        const gapsGroup = new Adw.PreferencesGroup({
            title: 'Spacing & Margins',
            description: 'Configure pixel distances between windows and monitor edges'
        });

        const innerGapRow = new Adw.SpinRow({
            title: 'Inner Gap',
            subtitle: 'Spacing between adjacent windows',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 64,
                step_increment: 2,
                page_increment: 4
            })
        });
        settings.bind('inner-gap', innerGapRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        gapsGroup.add(innerGapRow);

        const outerGapRow = new Adw.SpinRow({
            title: 'Outer Gap',
            subtitle: 'Screen edge margin around tiled area',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 64,
                step_increment: 2,
                page_increment: 4
            })
        });
        settings.bind('outer-gap', outerGapRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        gapsGroup.add(outerGapRow);

        const horizGapRow = new Adw.SpinRow({
            title: 'Horizontal Spacing',
            subtitle: 'Column-to-column spacing',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 64,
                step_increment: 2,
                page_increment: 4
            })
        });
        settings.bind('horizontal-gap', horizGapRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        gapsGroup.add(horizGapRow);

        const vertGapRow = new Adw.SpinRow({
            title: 'Vertical Spacing',
            subtitle: 'Row-to-row spacing',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 64,
                step_increment: 2,
                page_increment: 4
            })
        });
        settings.bind('vertical-gap', vertGapRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        gapsGroup.add(vertGapRow);

        gapsPage.add(gapsGroup);

        // -------------------------------------------------------------
        // Page 3: Floating Rules
        // -------------------------------------------------------------
        const floatPage = new Adw.PreferencesPage({
            title: 'Floating',
            icon_name: 'window-pop-out-symbolic'
        });

        const floatGroup = new Adw.PreferencesGroup({
            title: 'Application Exceptions',
            description: 'Applications that are kept in floating mode by default'
        });

        // Add application row
        const addEntryRow = new Adw.EntryRow({
            title: 'Add Application ID or WM Class'
        });

        const addBtn = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat']
        });
        addEntryRow.add_suffix(addBtn);

        floatGroup.add(addEntryRow);

        // Container for active floating rules
        const rulesListGroup = new Adw.PreferencesGroup({
            title: 'Active Exceptions'
        });

        const refreshRules = () => {
            // Remove previous items from group
            const currentRules = settings.get_strv('floating-applications') || [];
            // Adw.PreferencesGroup doesn't have a direct removeAll, but we can manage child rows
        };

        const currentRules = settings.get_strv('floating-applications') || [];
        for (const rule of currentRules) {
            const ruleRow = new Adw.ActionRow({
                title: rule
            });
            const delBtn = new Gtk.Button({
                icon_name: 'user-trash-symbolic',
                valign: Gtk.Align.CENTER,
                css_classes: ['flat', 'destructive-action']
            });
            delBtn.connect('clicked', () => {
                const list = settings.get_strv('floating-applications') || [];
                const updated = list.filter(r => r !== rule);
                settings.set_strv('floating-applications', updated);
                rulesListGroup.remove(ruleRow);
            });
            ruleRow.add_suffix(delBtn);
            rulesListGroup.add(ruleRow);
        }

        addBtn.connect('clicked', () => {
            const text = addEntryRow.text.trim();
            if (text) {
                const list = settings.get_strv('floating-applications') || [];
                if (!list.includes(text)) {
                    list.push(text);
                    settings.set_strv('floating-applications', list);

                    const newRow = new Adw.ActionRow({ title: text });
                    const del = new Gtk.Button({
                        icon_name: 'user-trash-symbolic',
                        valign: Gtk.Align.CENTER,
                        css_classes: ['flat', 'destructive-action']
                    });
                    del.connect('clicked', () => {
                        const cur = settings.get_strv('floating-applications') || [];
                        settings.set_strv('floating-applications', cur.filter(r => r !== text));
                        rulesListGroup.remove(newRow);
                    });
                    newRow.add_suffix(del);
                    rulesListGroup.add(newRow);
                }
                addEntryRow.text = '';
            }
        });

        floatPage.add(floatGroup);
        floatPage.add(rulesListGroup);

        // -------------------------------------------------------------
        // Page 4: Shortcuts Reference & Reset
        // -------------------------------------------------------------
        const shortcutsPage = new Adw.PreferencesPage({
            title: 'Shortcuts',
            icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic'
        });

        const shortcutsGroup = new Adw.PreferencesGroup({
            title: 'Default Keyboard Navigation',
            description: 'Use Super key modifier combinations'
        });

        const keyList = [
            { title: 'Toggle Tiling', key: 'toggle-tiling', defaultKey: 'Super + Y' },
            { title: 'Focus Left / Right / Up / Down', key: 'focus-left', defaultKey: 'Super + H / L / K / J' },
            { title: 'Move Left / Right / Up / Down', key: 'move-left', defaultKey: 'Super + Shift + H / L / K / J' },
            { title: 'Toggle Floating Mode', key: 'toggle-floating', defaultKey: 'Super + G' },
            { title: 'Cycle Layout Strategy', key: 'cycle-layout', defaultKey: 'Super + Space' },
            { title: 'Move to Workspace', key: 'move-to-workspace-up', defaultKey: 'Super + Alt + Up / Down' },
            { title: 'Move to Monitor', key: 'move-to-monitor-left', defaultKey: 'Super + Ctrl + Left / Right' }
        ];

        for (const item of keyList) {
            const row = new Adw.ActionRow({
                title: item.title,
                subtitle: item.defaultKey
            });
            shortcutsGroup.add(row);
        }
        shortcutsPage.add(shortcutsGroup);

        const resetGroup = new Adw.PreferencesGroup({
            title: 'Maintenance'
        });

        const resetBtn = new Gtk.Button({
            label: 'Reset All Settings to Defaults',
            css_classes: ['destructive-action'],
            halign: Gtk.Align.CENTER
        });
        resetBtn.connect('clicked', () => {
            const keys = [
                'enable-tiling',
                'default-layout',
                'inner-gap',
                'outer-gap',
                'horizontal-gap',
                'vertical-gap',
                'floating-applications',
                'toggle-tiling',
                'focus-left',
                'focus-right',
                'focus-up',
                'focus-down',
                'move-left',
                'move-right',
                'move-up',
                'move-down',
                'toggle-floating',
                'cycle-layout',
                'move-to-workspace-up',
                'move-to-workspace-down',
                'move-to-monitor-left',
                'move-to-monitor-right'
            ];
            for (const k of keys) {
                settings.reset(k);
            }
        });
        resetGroup.add(resetBtn);
        shortcutsPage.add(resetGroup);

        // Add pages to window
        window.add(generalPage);
        window.add(gapsPage);
        window.add(floatPage);
        window.add(shortcutsPage);
    }
}

