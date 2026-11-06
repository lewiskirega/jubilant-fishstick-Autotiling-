/**
 * Fedora AutoTile - Dynamic Grid Layout
 * Automatically tiles N windows into a balanced, responsive grid.
 * Dynamically partitions columns and rows based on screen aspect ratio.
 */

import { Rectangle } from '../core/geometry.js';

export class DynamicGridLayout {
    constructor() {
        this.name = 'dynamic-grid';
        this.label = 'Dynamic Grid';
    }

    /**
     * Compute geometry for N windows
     * @param {Rectangle} workArea - Screen/workspace work area
     * @param {Array<object>} windows - Array of window descriptors: { id, minWidth, minHeight }
     * @param {object} gaps - Gap configuration { inner, outer, horizontal, vertical }
     * @returns {Map<object, Rectangle>} Map from window object to calculated target Rectangle
     */
    calculateLayout(workArea, windows, gaps = {}) {
        const placements = new Map();
        if (!windows || windows.length === 0) {
            return placements;
        }

        const usableArea = Rectangle.applyOuterGaps(workArea, gaps);
        const count = windows.length;

        // Single window fills usable area
        if (count === 1) {
            const win = windows[0];
            const rect = Rectangle.clampToMinSize(
                usableArea,
                win.minWidth ?? 0,
                win.minHeight ?? 0,
                usableArea
            );
            placements.set(win, rect);
            return placements;
        }

        const isLandscape = usableArea.width >= usableArea.height;
        const gapX = gaps.horizontal ?? gaps.inner ?? 0;
        const gapY = gaps.vertical ?? gaps.inner ?? 0;

        if (isLandscape) {
            // Determine optimal number of columns based on window count and aspect ratio
            const aspect = usableArea.width / Math.max(1, usableArea.height);
            let numCols = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * (aspect / 1.3)))));
            if (numCols < 1) numCols = 1;

            // Distribute windows among columns.
            // Extra windows are placed in later columns so the primary/left column remains spacious.
            const basePerCol = Math.floor(count / numCols);
            const remainder = count % numCols;

            const colCounts = [];
            for (let c = 0; c < numCols; c++) {
                const getsExtra = (numCols - 1 - c < remainder) ? 1 : 0;
                colCounts.push(basePerCol + getsExtra);
            }

            const totalGapX = (numCols - 1) * gapX;
            const availableW = Math.max(10, usableArea.width - totalGapX);
            const colWidth = availableW / numCols;

            let windowIndex = 0;
            for (let c = 0; c < numCols; c++) {
                const winsInThisCol = colCounts[c];
                if (winsInThisCol === 0) continue;

                const colStartX = Math.round(usableArea.x + (c * (colWidth + gapX)));
                const colEndX = Math.round(usableArea.x + ((c + 1) * colWidth) + (c * gapX));
                const actualColW = Math.max(10, colEndX - colStartX);

                const totalGapY = (winsInThisCol - 1) * gapY;
                const availableH = Math.max(10, usableArea.height - totalGapY);
                const rowHeight = availableH / winsInThisCol;

                for (let r = 0; r < winsInThisCol; r++) {
                    const win = windows[windowIndex++];
                    const rowStartY = Math.round(usableArea.y + (r * (rowHeight + gapY)));
                    const rowEndY = Math.round(usableArea.y + ((r + 1) * rowHeight) + (r * gapY));
                    const actualRowH = Math.max(10, rowEndY - rowStartY);

                    const targetRect = new Rectangle(colStartX, rowStartY, actualColW, actualRowH);
                    const clamped = Rectangle.clampToMinSize(
                        targetRect,
                        win.minWidth ?? 0,
                        win.minHeight ?? 0,
                        usableArea
                    );
                    placements.set(win, clamped);
                }
            }
        } else {
            // Portrait mode: partition rows first
            const aspect = usableArea.height / Math.max(1, usableArea.width);
            let numRows = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * (aspect / 1.3)))));
            if (numRows < 1) numRows = 1;

            const basePerRow = Math.floor(count / numRows);
            const remainder = count % numRows;

            const rowCounts = [];
            for (let r = 0; r < numRows; r++) {
                const getsExtra = (numRows - 1 - r < remainder) ? 1 : 0;
                rowCounts.push(basePerRow + getsExtra);
            }

            const totalGapY = (numRows - 1) * gapY;
            const availableH = Math.max(10, usableArea.height - totalGapY);
            const rowHeight = availableH / numRows;

            let windowIndex = 0;
            for (let r = 0; r < numRows; r++) {
                const winsInThisRow = rowCounts[r];
                if (winsInThisRow === 0) continue;

                const rowStartY = Math.round(usableArea.y + (r * (rowHeight + gapY)));
                const rowEndY = Math.round(usableArea.y + ((r + 1) * rowHeight) + (r * gapY));
                const actualRowH = Math.max(10, rowEndY - rowStartY);

                const totalGapX = (winsInThisRow - 1) * gapX;
                const availableW = Math.max(10, usableArea.width - totalGapX);
                const colWidth = availableW / winsInThisRow;

                for (let c = 0; c < winsInThisRow; c++) {
                    const win = windows[windowIndex++];
                    const colStartX = Math.round(usableArea.x + (c * (colWidth + gapX)));
                    const colEndX = Math.round(usableArea.x + ((c + 1) * colWidth) + (c * gapX));
                    const actualColW = Math.max(10, colEndX - colStartX);

                    const targetRect = new Rectangle(colStartX, rowStartY, actualColW, actualRowH);
                    const clamped = Rectangle.clampToMinSize(
                        targetRect,
                        win.minWidth ?? 0,
                        win.minHeight ?? 0,
                        usableArea
                    );
                    placements.set(win, clamped);
                }
            }
        }

        return placements;
    }
}
