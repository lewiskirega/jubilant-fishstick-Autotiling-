/**
 * Fedora AutoTile - Vertical Split Layout
 * Stacks all windows top-to-bottom in equal-height horizontal rows.
 */

import { Rectangle } from '../core/geometry.js';

export class VerticalSplitLayout {
    constructor() {
        this.name = 'vertical-split';
        this.label = 'Vertical Split';
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
        const gapY = gaps.vertical ?? gaps.inner ?? 0;

        const totalGapY = (count - 1) * gapY;
        const availableH = Math.max(10, usableArea.height - totalGapY);
        const rowH = availableH / count;

        for (let i = 0; i < count; i++) {
            const win = windows[i];
            const startY = Math.round(usableArea.y + (i * (rowH + gapY)));
            const endY = Math.round(usableArea.y + ((i + 1) * rowH) + (i * gapY));
            const h = Math.max(10, endY - startY);

            const targetRect = new Rectangle(usableArea.x, startY, usableArea.width, h);
            placements.set(win, Rectangle.clampToMinSize(targetRect, win.minWidth, win.minHeight, usableArea));
        }

        return placements;
    }
}
