/**
 * Fedora AutoTile - Master and Stack Layout
 * Features a primary master window with secondary windows stacked vertically.
 */

import { Rectangle } from '../core/geometry.js';

export class MasterStackLayout {
    /**
     * @param {number} masterRatio - Fraction of screen allocated to master window (0.1 to 0.9)
     */
    constructor(masterRatio = 0.55) {
        this.name = 'master-stack';
        this.label = 'Master & Stack';
        this.masterRatio = masterRatio;
    }

    /**
     * @param {Rectangle} workArea
     * @param {Array<object>} windows
     * @param {object} gaps
     * @returns {Map<object, Rectangle>}
     */
    calculateLayout(workArea, windows, gaps = {}) {
        const placements = new Map();
        if (!windows || windows.length === 0) return placements;

        const usableArea = Rectangle.applyOuterGaps(workArea, gaps);
        const count = windows.length;

        if (count === 1) {
            const win = windows[0];
            placements.set(win, Rectangle.clampToMinSize(usableArea, win.minWidth, win.minHeight, usableArea));
            return placements;
        }

        const isLandscape = usableArea.width >= usableArea.height;
        const gapX = gaps.horizontal ?? gaps.inner ?? 0;
        const gapY = gaps.vertical ?? gaps.inner ?? 0;

        if (isLandscape) {
            const availableW = Math.max(20, usableArea.width - gapX);
            const masterW = Math.round(availableW * this.masterRatio);
            const stackW = Math.max(10, availableW - masterW);

            // Master window
            const masterWin = windows[0];
            const masterRect = new Rectangle(usableArea.x, usableArea.y, masterW, usableArea.height);
            placements.set(masterWin, Rectangle.clampToMinSize(masterRect, masterWin.minWidth, masterWin.minHeight, usableArea));

            // Stack windows
            const stackCount = count - 1;
            const stackStartX = usableArea.x + masterW + gapX;
            const totalStackGapY = (stackCount - 1) * gapY;
            const availableStackH = Math.max(10, usableArea.height - totalStackGapY);
            const stackRowH = availableStackH / stackCount;

            for (let i = 0; i < stackCount; i++) {
                const win = windows[i + 1];
                const startY = Math.round(usableArea.y + (i * (stackRowH + gapY)));
                const endY = Math.round(usableArea.y + ((i + 1) * stackRowH) + (i * gapY));
                const h = Math.max(10, endY - startY);

                const targetRect = new Rectangle(stackStartX, startY, stackW, h);
                placements.set(win, Rectangle.clampToMinSize(targetRect, win.minWidth, win.minHeight, usableArea));
            }
        } else {
            // Portrait: Master on top, stack on bottom
            const availableH = Math.max(20, usableArea.height - gapY);
            const masterH = Math.round(availableH * this.masterRatio);
            const stackH = Math.max(10, availableH - masterH);

            const masterWin = windows[0];
            const masterRect = new Rectangle(usableArea.x, usableArea.y, usableArea.width, masterH);
            placements.set(masterWin, Rectangle.clampToMinSize(masterRect, masterWin.minWidth, masterWin.minHeight, usableArea));

            const stackCount = count - 1;
            const stackStartY = usableArea.y + masterH + gapY;
            const totalStackGapX = (stackCount - 1) * gapX;
            const availableStackW = Math.max(10, usableArea.width - totalStackGapX);
            const stackColW = availableStackW / stackCount;

            for (let i = 0; i < stackCount; i++) {
                const win = windows[i + 1];
                const startX = Math.round(usableArea.x + (i * (stackColW + gapX)));
                const endX = Math.round(usableArea.x + ((i + 1) * stackColW) + (i * gapX));
                const w = Math.max(10, endX - startX);

                const targetRect = new Rectangle(startX, stackStartY, w, stackH);
                placements.set(win, Rectangle.clampToMinSize(targetRect, win.minWidth, win.minHeight, usableArea));
            }
        }

        return placements;
    }
}
