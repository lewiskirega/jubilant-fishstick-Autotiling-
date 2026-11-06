/**
 * Fedora AutoTile - Adaptive Grid Layout
 * Intelligently switches strategy based on monitor geometry and ultrawide aspect ratios.
 */

import { Rectangle } from '../core/geometry.js';
import { DynamicGridLayout } from './grid.js';
import { MasterStackLayout } from './masterStack.js';

export class AdaptiveGridLayout {
    constructor() {
        this.name = 'adaptive-grid';
        this.label = 'Adaptive Grid';
        this._dynamic = new DynamicGridLayout();
        this._master = new MasterStackLayout(0.5);
    }

    /**
     * @param {Rectangle} workArea
     * @param {Array<object>} windows
     * @param {object} gaps
     * @returns {Map<object, Rectangle>}
     */
    calculateLayout(workArea, windows, gaps = {}) {
        if (!windows || windows.length === 0) return new Map();

        const aspect = workArea.width / Math.max(1, workArea.height);

        // Ultrawide (>= 21:9 / 2.1 aspect ratio) with 3+ windows: 3-column master-center or master-stack
        if (aspect >= 2.1 && windows.length >= 3) {
            return this._calculateUltrawide(workArea, windows, gaps);
        }

        // Standard aspect ratios delegate to dynamic grid
        return this._dynamic.calculateLayout(workArea, windows, gaps);
    }

    _calculateUltrawide(workArea, windows, gaps) {
        const placements = new Map();
        const usableArea = Rectangle.applyOuterGaps(workArea, gaps);
        const count = windows.length;
        const gapX = gaps.horizontal ?? gaps.inner ?? 0;
        const gapY = gaps.vertical ?? gaps.inner ?? 0;

        // 3 columns: Center is primary (40% width), Left is stack (30%), Right is stack (30%)
        const numCols = 3;
        const totalGapX = (numCols - 1) * gapX;
        const availableW = Math.max(30, usableArea.width - totalGapX);

        const centerW = Math.round(availableW * 0.44);
        const sideW = Math.max(10, Math.floor((availableW - centerW) / 2));

        // Window 0 is center master
        const centerWin = windows[0];
        const centerStartX = usableArea.x + sideW + gapX;
        const centerRect = new Rectangle(centerStartX, usableArea.y, centerW, usableArea.height);
        placements.set(centerWin, Rectangle.clampToMinSize(centerRect, centerWin.minWidth, centerWin.minHeight, usableArea));

        // Partition remaining windows between left and right columns
        const remaining = windows.slice(1);
        const leftCount = Math.ceil(remaining.length / 2);
        const rightCount = remaining.length - leftCount;

        // Left column
        const leftStartX = usableArea.x;
        const totalLeftGapY = Math.max(0, (leftCount - 1) * gapY);
        const leftRowH = Math.max(10, (usableArea.height - totalLeftGapY) / Math.max(1, leftCount));
        for (let i = 0; i < leftCount; i++) {
            const win = remaining[i];
            const startY = Math.round(usableArea.y + (i * (leftRowH + gapY)));
            const endY = Math.round(usableArea.y + ((i + 1) * leftRowH) + (i * gapY));
            const h = Math.max(10, endY - startY);
            const target = new Rectangle(leftStartX, startY, sideW, h);
            placements.set(win, Rectangle.clampToMinSize(target, win.minWidth, win.minHeight, usableArea));
        }

        // Right column
        const rightStartX = centerStartX + centerW + gapX;
        const totalRightGapY = Math.max(0, (rightCount - 1) * gapY);
        const rightRowH = Math.max(10, (usableArea.height - totalRightGapY) / Math.max(1, rightCount));
        for (let i = 0; i < rightCount; i++) {
            const win = remaining[leftCount + i];
            const startY = Math.round(usableArea.y + (i * (rightRowH + gapY)));
            const endY = Math.round(usableArea.y + ((i + 1) * rightRowH) + (i * gapY));
            const h = Math.max(10, endY - startY);
            const target = new Rectangle(rightStartX, startY, sideW, h);
            placements.set(win, Rectangle.clampToMinSize(target, win.minWidth, win.minHeight, usableArea));
        }

        return placements;
    }
}
