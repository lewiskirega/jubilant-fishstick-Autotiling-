/**
 * Fedora AutoTile - GNOME 50 & 51 Compatibility Layer
 * Provides abstraction across GNOME 50, 51 and future versions.
 */

import * as Config from 'resource:///org/gnome/shell/misc/config.js';

export function getShellVersion() {
    const raw = Config.PACKAGE_VERSION ?? '51.0';
    const parts = raw.split('.').map(p => parseInt(p, 10));
    return {
        major: parts[0] || 51,
        minor: parts[1] || 0,
        raw
    };
}

export function isGnome50OrNewer() {
    const ver = getShellVersion();
    return ver.major >= 50;
}
