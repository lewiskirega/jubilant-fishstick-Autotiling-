/**
 * Test suite for Dynamic Grid layout calculations
 */

import { Rectangle } from '../src/core/geometry.js';
import { DynamicGridLayout } from '../src/layouts/grid.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function runTests() {
    console.log('--- Running Dynamic Grid Layout Tests ---');

    const layout = new DynamicGridLayout();
    const workArea = new Rectangle(0, 32, 1920, 1048); // e.g. 1920x1080 with 32px top panel
    const gaps = { outer: 8, inner: 6, horizontal: 6, vertical: 6 };

    // Test 1: Empty window list
    {
        const result = layout.calculateLayout(workArea, [], gaps);
        assert(result.size === 0, 'Empty window list should produce 0 placements');
        console.log('✓ Test 1: Empty window list');
    }

    // Test 2: Single window fills usable area
    {
        const w1 = { id: 1, minWidth: 200, minHeight: 150 };
        const result = layout.calculateLayout(workArea, [w1], gaps);
        assert(result.size === 1, 'Single window count');
        const rect = result.get(w1);
        assert(rect.x === workArea.x + 8, `Expected x=${workArea.x + 8}, got ${rect.x}`);
        assert(rect.y === workArea.y + 8, `Expected y=${workArea.y + 8}, got ${rect.y}`);
        assert(rect.width === 1920 - 16, `Expected width=1904, got ${rect.width}`);
        assert(rect.height === 1048 - 16, `Expected height=1032, got ${rect.height}`);
        console.log('✓ Test 2: Single window full work area');
    }

    // Test 3: Two windows side-by-side in landscape
    {
        const w1 = { id: 1 }, w2 = { id: 2 };
        const result = layout.calculateLayout(workArea, [w1, w2], gaps);
        assert(result.size === 2, '2 windows count');
        const r1 = result.get(w1);
        const r2 = result.get(w2);

        // Check horizontal arrangement without overlap
        assert(r1.right + gaps.horizontal === r2.x, `r1.right (${r1.right}) + gap (${gaps.horizontal}) should equal r2.x (${r2.x})`);
        assert(r1.y === r2.y, 'Windows should align vertically');
        assert(r1.height === r2.height, 'Windows should have equal height');
        console.log('✓ Test 3: 2 windows side-by-side without overlap or gap drift');
    }

    // Test 4: 3 windows in landscape (1 left, 2 stacked right)
    {
        const w1 = { id: 1 }, w2 = { id: 2 }, w3 = { id: 3 };
        const result = layout.calculateLayout(workArea, [w1, w2, w3], gaps);
        assert(result.size === 3, '3 windows count');
        const r1 = result.get(w1);
        const r2 = result.get(w2);
        const r3 = result.get(w3);

        // r2 and r3 should be stacked vertically in right column
        assert(r2.x === r3.x, 'Right column windows should align horizontally');
        assert(r2.bottom + gaps.vertical === r3.y, 'r2 bottom + vertical gap should equal r3 y');
        assert(r1.right + gaps.horizontal === r2.x, 'Left column right + gap should equal right column x');
        console.log('✓ Test 4: 3 windows balanced columns (1 left, 2 stacked right)');
    }

    // Test 5: 4 windows in 2x2 grid
    {
        const wins = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
        const result = layout.calculateLayout(workArea, wins, gaps);
        assert(result.size === 4, '4 windows count');

        const [r1, r2, r3, r4] = wins.map(w => result.get(w));
        // Left column: r1 on top of r2
        assert(r1.x === r2.x, 'r1 and r2 in col 0');
        assert(r1.bottom + gaps.vertical === r2.y, 'r1 on top of r2');
        // Right column: r3 on top of r4
        assert(r3.x === r4.x, 'r3 and r4 in col 1');
        assert(r3.bottom + gaps.vertical === r4.y, 'r3 on top of r4');
        // Between cols
        assert(r1.right + gaps.horizontal === r3.x, 'col 0 and col 1 gap');
        console.log('✓ Test 5: 4 windows 2x2 grid');
    }

    // Test 6: Portrait orientation (vertical screen)
    {
        const portraitWorkArea = new Rectangle(0, 32, 1080, 1888);
        const wins = [{ id: 1 }, { id: 2 }];
        const result = layout.calculateLayout(portraitWorkArea, wins, gaps);
        const [r1, r2] = wins.map(w => result.get(w));
        assert(r1.bottom + gaps.vertical === r2.y, 'Portrait mode stacks vertically');
        assert(r1.width === r2.width, 'Portrait windows share full width');
        console.log('✓ Test 6: Portrait screen adaptive layout');
    }

    // Test 7: Min size clamping
    {
        const w1 = { id: 1, minWidth: 1200, minHeight: 400 };
        const w2 = { id: 2, minWidth: 200, minHeight: 200 };
        const result = layout.calculateLayout(workArea, [w1, w2], gaps);
        const r1 = result.get(w1);
        assert(r1.width >= 1200, `Expected min width >= 1200, got ${r1.width}`);
        console.log('✓ Test 7: Window minimum size constraint satisfied');
    }

    console.log('All Dynamic Grid Layout tests passed!\n');
}

runTests();
