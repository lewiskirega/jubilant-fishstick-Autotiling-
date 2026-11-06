/**
 * Comprehensive test suite verifying all 5 layouts
 */

import { Rectangle } from '../src/core/geometry.js';
import { LayoutFactory, AVAILABLE_LAYOUTS } from '../src/layouts/layoutFactory.js';

function assert(condition, msg) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

function runAll() {
    console.log('--- Testing Layout Factory & All 5 Layouts ---');
    const factory = new LayoutFactory();
    const workArea = new Rectangle(0, 32, 1920, 1048);
    const gaps = { outer: 10, inner: 8, horizontal: 8, vertical: 8 };

    // 1. Check all layouts exist in factory
    for (const info of AVAILABLE_LAYOUTS) {
        const layout = factory.getLayout(info.id);
        assert(layout !== undefined, `Layout ${info.id} should be registered`);
        assert(layout.name === info.id, `Layout name match: ${layout.name} vs ${info.id}`);
    }
    console.log('✓ All 5 layout instances registered successfully');

    // 2. Master and Stack
    {
        const ms = factory.getLayout('master-stack');
        const wins = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const result = ms.calculateLayout(workArea, wins, gaps);
        assert(result.size === 3, 'MasterStack size 3');
        const [r1, r2, r3] = wins.map(w => result.get(w));
        // Master window should be on the left
        assert(r1.x === workArea.x + 10, 'Master starts at left outer gap');
        assert(r1.right + 8 === r2.x, 'Master right + gap equals stack left');
        assert(r2.x === r3.x, 'Stack windows aligned vertically');
        assert(r2.bottom + 8 === r3.y, 'Stack windows stacked');
        console.log('✓ Master & Stack layout verified');
    }

    // 3. Horizontal Split
    {
        const hs = factory.getLayout('horizontal-split');
        const wins = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const result = hs.calculateLayout(workArea, wins, gaps);
        assert(result.size === 3, 'HorizontalSplit size 3');
        const [r1, r2, r3] = wins.map(w => result.get(w));
        assert(r1.y === r2.y && r2.y === r3.y, 'All windows at top y');
        assert(r1.height === r2.height && r2.height === r3.height, 'All windows equal height');
        assert(r1.right + 8 === r2.x, 'Gap between 1 and 2');
        assert(r2.right + 8 === r3.x, 'Gap between 2 and 3');
        console.log('✓ Horizontal Split layout verified');
    }

    // 4. Vertical Split
    {
        const vs = factory.getLayout('vertical-split');
        const wins = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const result = vs.calculateLayout(workArea, wins, gaps);
        assert(result.size === 3, 'VerticalSplit size 3');
        const [r1, r2, r3] = wins.map(w => result.get(w));
        assert(r1.x === r2.x && r2.x === r3.x, 'All windows at left x');
        assert(r1.width === r2.width && r2.width === r3.width, 'All windows equal width');
        assert(r1.bottom + 8 === r2.y, 'Gap between 1 and 2 vertically');
        assert(r2.bottom + 8 === r3.y, 'Gap between 2 and 3 vertically');
        console.log('✓ Vertical Split layout verified');
    }

    // 5. Adaptive Grid (Standard and Ultrawide)
    {
        const ag = factory.getLayout('adaptive-grid');
        // Standard wide
        const wins3 = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const stdResult = ag.calculateLayout(workArea, wins3, gaps);
        assert(stdResult.size === 3, 'Standard aspect ratio uses dynamic grid');

        // Ultrawide (3440 x 1440) -> 2.38 aspect ratio
        const ultrawideWorkArea = new Rectangle(0, 32, 3440, 1408);
        const ultraResult = ag.calculateLayout(ultrawideWorkArea, wins3, gaps);
        assert(ultraResult.size === 3, 'Ultrawide calculates 3 placements');
        const [r1, r2, r3] = wins3.map(w => ultraResult.get(w));
        // r1 is center master, r2 is left stack, r3 is right stack
        assert(r2.x === ultrawideWorkArea.x + 10, 'Left stack starts at left margin');
        assert(r2.right + 8 === r1.x, 'Left stack right + gap equals center master x');
        assert(r1.right + 8 === r3.x, 'Center master right + gap equals right stack x');
        console.log('✓ Adaptive Grid (Standard & Ultrawide) verified');
    }

    // 6. Next layout cycling
    {
        let current = 'dynamic-grid';
        current = factory.getNextLayoutId(current);
        assert(current === 'master-stack', 'Cycles to master-stack');
        current = factory.getNextLayoutId(current);
        assert(current === 'horizontal-split', 'Cycles to horizontal-split');
        current = factory.getNextLayoutId(current);
        assert(current === 'vertical-split', 'Cycles to vertical-split');
        current = factory.getNextLayoutId(current);
        assert(current === 'adaptive-grid', 'Cycles to adaptive-grid');
        current = factory.getNextLayoutId(current);
        assert(current === 'dynamic-grid', 'Cycles back to dynamic-grid');
        console.log('✓ Layout cycling verified');
    }

    console.log('All layout tests passed!\n');
}

runAll();

