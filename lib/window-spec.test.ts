/**
 * Window Specification Module Unit Tests
 * 
 * Tests for window size presets, pricing multipliers, and formatting helpers.
 * Run with: npx tsx lib/window-spec.test.ts
 */

import {
  formatWindowSpec,
  formatWindowSpecShort,
  getWindowSizeCategory,
  getWindowSizeMultiplier,
  getDimensionsFromPreset,
  getEffectiveDimensions,
  isValidWindowQuantity,
  isValidCustomDimension,
  WINDOW_SIZE_PRESETS,
  WINDOW_DEFAULTS,
} from './window-spec';

// ============ TEST UTILITIES ============

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    console.log(`   Expected: ${expectedStr}`);
    console.log(`   Got: ${actualStr}`);
    failed++;
  }
}

// ============ TESTS ============

function testFormatWindowSpec() {
  console.log('\n--- Testing formatWindowSpec ---');
  
  assertEqual(
    formatWindowSpec(1, '30x60'),
    '1 window (30" × 60")',
    'Should format single window with preset size'
  );
  
  assertEqual(
    formatWindowSpec(3, '36x72'),
    '3 windows (36" × 72")',
    'Should format multiple windows with preset size'
  );
  
  assertEqual(
    formatWindowSpec(2, 'custom', 42, 48),
    '2 windows (custom 42" × 48")',
    'Should format custom size correctly'
  );
  
  assertEqual(
    formatWindowSpec(1, 'custom'),
    '1 window (standard size)',
    'Should handle custom preset without dimensions'
  );
  
  assert(
    formatWindowSpec(1, '24x36').includes('window ('),
    'Should use singular "window" for quantity 1'
  );
  
  assert(
    formatWindowSpec(5, '48x60').includes('windows ('),
    'Should use plural "windows" for quantity > 1'
  );
}

function testFormatWindowSpecShort() {
  console.log('\n--- Testing formatWindowSpecShort ---');
  
  assertEqual(
    formatWindowSpecShort(2, '30x60'),
    '2 windows, 30×60',
    'Should format short spec for preset'
  );
  
  assertEqual(
    formatWindowSpecShort(1, '36x72'),
    '1 window, 36×72',
    'Should format short spec for single window'
  );
  
  assertEqual(
    formatWindowSpecShort(3, 'custom', 40, 50),
    '3 windows, 40×50',
    'Should format short spec for custom size'
  );
}

function testGetWindowSizeCategory() {
  console.log('\n--- Testing getWindowSizeCategory ---');
  
  // Small windows: <= 1620 sq in (30x54)
  assertEqual(
    getWindowSizeCategory(24, 36),
    'small',
    '24x36 (864 sq in) should be small'
  );
  assertEqual(
    getWindowSizeCategory(30, 54),
    'small',
    '30x54 (1620 sq in) should be small (boundary)'
  );
  
  // Standard windows: 1621-2879 sq in
  assertEqual(
    getWindowSizeCategory(30, 60),
    'standard',
    '30x60 (1800 sq in) should be standard'
  );
  assertEqual(
    getWindowSizeCategory(36, 60),
    'standard',
    '36x60 (2160 sq in) should be standard'
  );
  assertEqual(
    getWindowSizeCategory(36, 72),
    'standard',
    '36x72 (2592 sq in) should be standard'
  );
  
  // Large windows: >= 2880 sq in (48x60)
  assertEqual(
    getWindowSizeCategory(48, 60),
    'large',
    '48x60 (2880 sq in) should be large (boundary)'
  );
  assertEqual(
    getWindowSizeCategory(60, 60),
    'large',
    '60x60 (3600 sq in) should be large'
  );
}

function testGetWindowSizeMultiplier() {
  console.log('\n--- Testing getWindowSizeMultiplier ---');
  
  assertEqual(
    getWindowSizeMultiplier(24, 36),
    0.9,
    'Small windows should have 0.9 multiplier'
  );
  
  assertEqual(
    getWindowSizeMultiplier(30, 60),
    1.0,
    'Standard windows (30x60) should have 1.0 multiplier'
  );
  
  assertEqual(
    getWindowSizeMultiplier(36, 72),
    1.0,
    'Standard windows (36x72) should have 1.0 multiplier'
  );
  
  assertEqual(
    getWindowSizeMultiplier(48, 60),
    1.2,
    'Large windows should have 1.2 multiplier'
  );
}

function testGetDimensionsFromPreset() {
  console.log('\n--- Testing getDimensionsFromPreset ---');
  
  assertEqual(
    getDimensionsFromPreset('30x60'),
    { width: 30, height: 60 },
    'Should return correct dimensions for 30x60'
  );
  
  assertEqual(
    getDimensionsFromPreset('36x72'),
    { width: 36, height: 72 },
    'Should return correct dimensions for 36x72'
  );
  
  assertEqual(
    getDimensionsFromPreset('24x36'),
    { width: 24, height: 36 },
    'Should return correct dimensions for 24x36'
  );
  
  assertEqual(
    getDimensionsFromPreset('custom'),
    null,
    'Should return null for custom preset'
  );
}

function testGetEffectiveDimensions() {
  console.log('\n--- Testing getEffectiveDimensions ---');
  
  assertEqual(
    getEffectiveDimensions('30x60'),
    { width: 30, height: 60 },
    'Should return preset dimensions'
  );
  
  assertEqual(
    getEffectiveDimensions('custom', 42, 48),
    { width: 42, height: 48 },
    'Should return custom dimensions when preset is custom'
  );
  
  assertEqual(
    getEffectiveDimensions('invalid'),
    { width: 30, height: 60 },
    'Should return default dimensions for invalid preset'
  );
  
  assertEqual(
    getEffectiveDimensions('custom'),
    { width: 30, height: 60 },
    'Should return default dimensions for custom without dimensions'
  );
}

function testIsValidWindowQuantity() {
  console.log('\n--- Testing isValidWindowQuantity ---');
  
  assert(isValidWindowQuantity(1), 'Quantity 1 should be valid');
  assert(isValidWindowQuantity(10), 'Quantity 10 should be valid');
  assert(isValidWindowQuantity(50), 'Quantity 50 should be valid');
  
  assert(!isValidWindowQuantity(0), 'Quantity 0 should be invalid');
  assert(!isValidWindowQuantity(-1), 'Negative quantity should be invalid');
  assert(!isValidWindowQuantity(51), 'Quantity 51 should be invalid');
  assert(!isValidWindowQuantity(100), 'Quantity 100 should be invalid');
  assert(!isValidWindowQuantity(1.5), 'Non-integer quantity should be invalid');
}

function testIsValidCustomDimension() {
  console.log('\n--- Testing isValidCustomDimension ---');
  
  assert(isValidCustomDimension(12), 'Dimension 12 should be valid');
  assert(isValidCustomDimension(36), 'Dimension 36 should be valid');
  assert(isValidCustomDimension(120), 'Dimension 120 should be valid');
  
  assert(!isValidCustomDimension(11), 'Dimension 11 should be invalid');
  assert(!isValidCustomDimension(0), 'Dimension 0 should be invalid');
  assert(!isValidCustomDimension(-10), 'Negative dimension should be invalid');
  assert(!isValidCustomDimension(121), 'Dimension 121 should be invalid');
  assert(!isValidCustomDimension(Infinity), 'Infinity should be invalid');
  assert(!isValidCustomDimension(NaN), 'NaN should be invalid');
}

function testWindowSizePresets() {
  console.log('\n--- Testing WINDOW_SIZE_PRESETS ---');
  
  const values = WINDOW_SIZE_PRESETS.map(p => p.value);
  
  assert(values.includes('24x36'), 'Should contain 24x36 preset');
  assert(values.includes('30x60'), 'Should contain 30x60 preset');
  assert(values.includes('36x72'), 'Should contain 36x72 preset');
  assert(values.includes('48x60'), 'Should contain 48x60 preset');
  assert(values.includes('custom'), 'Should contain custom preset');
  
  // All non-custom presets should have positive dimensions
  for (const preset of WINDOW_SIZE_PRESETS) {
    if (preset.value !== 'custom') {
      assert(
        preset.width > 0 && preset.height > 0,
        `Preset ${preset.value} should have positive dimensions`
      );
    }
  }
}

function testWindowDefaults() {
  console.log('\n--- Testing WINDOW_DEFAULTS ---');
  
  assertEqual(WINDOW_DEFAULTS.quantity, 1, 'Default quantity should be 1');
  assertEqual(WINDOW_DEFAULTS.sizePreset, '30x60', 'Default sizePreset should be 30x60');
  assertEqual(WINDOW_DEFAULTS.minQuantity, 1, 'Min quantity should be 1');
  assertEqual(WINDOW_DEFAULTS.maxQuantity, 50, 'Max quantity should be 50');
  assertEqual(WINDOW_DEFAULTS.minCustomDimension, 12, 'Min custom dimension should be 12');
  assertEqual(WINDOW_DEFAULTS.maxCustomDimension, 120, 'Max custom dimension should be 120');
}

// ============ RUN ALL TESTS ============

function runAllTests() {
  console.log('='.repeat(50));
  console.log('Window Specification Module Unit Tests');
  console.log('='.repeat(50));
  
  testFormatWindowSpec();
  testFormatWindowSpecShort();
  testGetWindowSizeCategory();
  testGetWindowSizeMultiplier();
  testGetDimensionsFromPreset();
  testGetEffectiveDimensions();
  testIsValidWindowQuantity();
  testIsValidCustomDimension();
  testWindowSizePresets();
  testWindowDefaults();
  
  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
