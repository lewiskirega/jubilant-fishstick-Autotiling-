/**
 * Fedora AutoTile - Horizontal Split Layout
 * Arranges all windows side-by-side in equal-width vertical columns.
 */

import { Rectangle } from '../core/geometry.js';

export class HorizontalSplitLayout {
    constructor() {
        this.name = 'horizontal-split';
        this.label = 'Horizontal Split';
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
        const gapX = gaps.horizontal ?? gaps.inner ?? 0;

        const totalGapX = (count - 1) * gapX;
        const availableW = Math.max(10, usableArea.width - totalGapX);
        const colW = availableW / count;

        for (let i = 0; i < count; i++) {
            const win = windows[i];
            const startX = Math.round(usableArea.x + (i * (colW + gapX)));
            const endX = Math.round(usableArea.x + ((i + 1) * colW) + (i * gapX));
            const w = Math.max(10, endX - startX);

            const targetRect = new Rectangle(startX, usableArea.y, w, usableArea.height);
            placements.set(win, Rectangle.clampToMinSize(targetRect, win.minWidth, win.minHeight, usableArea));
        }

        return placements;
    }
}
