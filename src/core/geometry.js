/**
 * Fedora AutoTile - Pure Geometry Utility Module
 * Handles rectangular arithmetic, gap distribution, and coordinate transformations.
 */

export class Rectangle {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = Math.round(x);
        this.y = Math.round(y);
        this.width = Math.max(0, Math.round(width));
        this.height = Math.max(0, Math.round(height));
    }

    /**
     * Clone rectangle
     * @returns {Rectangle}
     */
    clone() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    /**
     * Check equality with tolerance
     * @param {Rectangle} other
     * @param {number} tolerance
     * @returns {boolean}
     */
    equals(other, tolerance = 1) {
        if (!other) return false;
        return Math.abs(this.x - other.x) <= tolerance &&
               Math.abs(this.y - other.y) <= tolerance &&
               Math.abs(this.width - other.width) <= tolerance &&
               Math.abs(this.height - other.height) <= tolerance;
    }

    /**
     * @returns {number}
     */
    get right() {
        return this.x + this.width;
    }

    /**
     * @returns {number}
     */
    get bottom() {
        return this.y + this.height;
    }

    /**
     * @returns {number}
     */
    get aspectRatio() {
        return this.height > 0 ? this.width / this.height : 1;
    }

    /**
     * Apply outer and inner gaps to a container work area
     * @param {Rectangle} workArea - Screen or workspace work area
     * @param {object} gaps - Gap configuration
     * @param {number} gaps.outer - Outer border gap in pixels
     * @returns {Rectangle} Usable area after applying outer margins
     */
    static applyOuterGaps(workArea, gaps = {}) {
        const outer = gaps.outer ?? 0;
        const x = workArea.x + outer;
        const y = workArea.y + outer;
        const width = Math.max(100, workArea.width - (outer * 2));
        const height = Math.max(100, workArea.height - (outer * 2));
        return new Rectangle(x, y, width, height);
    }

    /**
     * Distribute rectangles across a grid matrix with inner gaps
     * @param {Rectangle} bounds - Usable area after outer gaps
     * @param {number} cols - Total columns
     * @param {number} rows - Total rows
     * @param {number} col - 0-based column index
     * @param {number} row - 0-based row index
     * @param {number} colSpan - Number of columns spanned
     * @param {number} rowSpan - Number of rows spanned
     * @param {object} gaps - Gap configuration
     * @param {number} gaps.inner - General inner gap
     * @param {number} gaps.horizontal - Specific horizontal gap (defaults to inner)
     * @param {number} gaps.vertical - Specific vertical gap (defaults to inner)
     * @returns {Rectangle}
     */
    static calculateCell(bounds, cols, rows, col, row, colSpan = 1, rowSpan = 1, gaps = {}) {
        const gapX = gaps.horizontal ?? gaps.inner ?? 0;
        const gapY = gaps.vertical ?? gaps.inner ?? 0;

        // Total available space minus gaps between columns/rows
        const totalGapWidth = Math.max(0, (cols - 1) * gapX);
        const totalGapHeight = Math.max(0, (rows - 1) * gapY);

        const availableWidth = Math.max(10, bounds.width - totalGapWidth);
        const availableHeight = Math.max(10, bounds.height - totalGapHeight);

        // Standard cell base size (floating point precision)
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;

        // Compute pixel coordinates ensuring pixel-perfect rounding without gaps or overlaps
        const startX = Math.round(bounds.x + (col * (cellWidth + gapX)));
        const endX = Math.round(bounds.x + ((col + colSpan) * cellWidth) + (col * gapX) + ((colSpan - 1) * gapX));

        const startY = Math.round(bounds.y + (row * (cellHeight + gapY)));
        const endY = Math.round(bounds.y + ((row + rowSpan) * cellHeight) + (row * gapY) + ((rowSpan - 1) * gapY));

        return new Rectangle(
            startX,
            startY,
            Math.max(10, endX - startX),
            Math.max(10, endY - startY)
        );
    }

    /**
     * Enforce window minimum constraints while preserving position as much as possible
     * @param {Rectangle} target
     * @param {number} minWidth
     * @param {number} minHeight
     * @param {Rectangle} container
     * @returns {Rectangle}
     */
    static clampToMinSize(target, minWidth = 0, minHeight = 0, container = null) {
        let width = Math.max(target.width, minWidth);
        let height = Math.max(target.height, minHeight);
        let x = target.x;
        let y = target.y;

        if (container) {
            // Keep inside container boundaries if width/height expanded
            if (x + width > container.right) {
                x = Math.max(container.x, container.right - width);
            }
            if (y + height > container.bottom) {
                y = Math.max(container.y, container.bottom - height);
            }
        }

        return new Rectangle(x, y, width, height);
    }
}

