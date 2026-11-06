/**
 * Test suite for Floating Rules and Exceptions
 */

import { FloatingManager, DEFAULT_FLOATING_CLASSES } from '../src/managers/floatingManager.js';

function assert(condition, msg) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

function runTests() {
    console.log('--- Testing Floating Exceptions & Rules ---');

    const mgr = new FloatingManager();

    // Test 1: Normal desktop apps should tile
    const terminal = { id: 101, wmClass: 'gnome-terminal-preferences', appId: 'org.gnome.Terminal', title: 'Terminal' };
    assert(!mgr.shouldFloat(terminal), 'Regular terminal window should tile');
    console.log('✓ Normal terminal window is tiled');

    // Test 2: Calculator in default exceptions should float
    const calc = { id: 102, wmClass: 'org.gnome.Calculator', appId: 'org.gnome.Calculator', title: 'Calculator' };
    assert(mgr.shouldFloat(calc), 'Calculator should float');
    console.log('✓ Calculator automatically floats');

    // Test 3: Settings/Control Center should float
    const settings = { id: 103, wmClass: 'gnome-control-center', appId: 'gnome-control-center', title: 'Settings' };
    assert(mgr.shouldFloat(settings), 'GNOME Settings should float');
    console.log('✓ GNOME Settings automatically floats');

    // Test 4: Dialog window type simulation
    const dialogWin = {
        id: 104,
        get_window_type: () => 1, // Meta.WindowType.DIALOG
        wmClass: 'firefox',
        appId: 'firefox',
        title: 'Open File'
    };
    assert(mgr.shouldFloat(dialogWin), 'Dialog window type should float');
    console.log('✓ Dialog window type automatically floats');

    // Test 5: Modal / transient-for window simulation
    const modalWin = {
        id: 105,
        get_window_type: () => 0, // NORMAL
        get_transient_for: () => ({ id: 100 }), // Attached to parent
        wmClass: 'gedit',
        title: 'Save As'
    };
    assert(mgr.shouldFloat(modalWin), 'Transient window should float');
    console.log('✓ Transient/modal window automatically floats');

    // Test 6: Fixed size window simulation
    const fixedWin = {
        id: 106,
        get_window_type: () => 0,
        can_maximize: () => false,
        wmClass: 'custom-tool'
    };
    assert(mgr.shouldFloat(fixedWin), 'Non-resizable window should float');
    console.log('✓ Fixed-size window automatically floats');

    // Test 7: Manual toggle float
    const browser = { id: 107, wmClass: 'firefox', title: 'Fedora Project' };
    assert(!mgr.shouldFloat(browser), 'Browser starts tiled');
    const newState = mgr.toggleFloat(browser);
    assert(newState === true, 'toggleFloat returned true (floating)');
    assert(mgr.shouldFloat(browser), 'Browser is now floating');
    const toggledBack = mgr.toggleFloat(browser);
    assert(toggledBack === false, 'toggleFloat returned false (tiled)');
    assert(!mgr.shouldFloat(browser), 'Browser is now tiled again');
    console.log('✓ Manual float toggle works');

    console.log('All floating manager tests passed!\n');
}

runTests();

