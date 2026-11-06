/**
 * Fedora AutoTile - Layout Factory & Registry
 */

import { DynamicGridLayout } from './grid.js';
import { MasterStackLayout } from './masterStack.js';
import { HorizontalSplitLayout } from './horizontal.js';
import { VerticalSplitLayout } from './vertical.js';
import { AdaptiveGridLayout } from './adaptive.js';

export const AVAILABLE_LAYOUTS = [
    { id: 'dynamic-grid', label: 'Dynamic Grid', icon: 'view-grid-symbolic' },
    { id: 'master-stack', label: 'Master & Stack', icon: 'view-paged-symbolic' },
    { id: 'horizontal-split', label: 'Horizontal Split', icon: 'view-column-symbolic' },
    { id: 'vertical-split', label: 'Vertical Split', icon: 'view-list-symbolic' },
    { id: 'adaptive-grid', label: 'Adaptive Grid', icon: 'view-dual-symbolic' }
];

export class LayoutFactory {
    constructor() {
        this._instances = new Map();
        this._instances.set('dynamic-grid', new DynamicGridLayout());
        this._instances.set('master-stack', new MasterStackLayout());
        this._instances.set('horizontal-split', new HorizontalSplitLayout());
        this._instances.set('vertical-split', new VerticalSplitLayout());
        this._instances.set('adaptive-grid', new AdaptiveGridLayout());
    }

    /**
     * Get a layout instance by ID
     * @param {string} id
     * @returns {object} Layout instance
     */
    getLayout(id) {
        return this._instances.get(id) ?? this._instances.get('dynamic-grid');
    }

    /**
     * Cycle to next layout
     * @param {string} currentId
     * @returns {string} Next layout id
     */
    getNextLayoutId(currentId) {
        const ids = AVAILABLE_LAYOUTS.map(l => l.id);
        const idx = ids.indexOf(currentId);
        if (idx === -1) return ids[0];
        return ids[(idx + 1) % ids.length];
    }
}
