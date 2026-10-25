import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, presetPixels } from '../src/data/presets';
import { EXAMPLES, examplePixels } from '../src/data/examples';
import { PALETTES } from '../src/data/palettes';
import { generatePattern } from '../src/lib/process';
import type { Brand } from '../src/lib/types';

test('every gallery card has a distinct, nonempty source with valid recommended dimensions', () => {
  assert.equal(PRESETS.length, 8);
  assert.equal(new Set(PRESETS.map(p => p.id)).size, PRESETS.length);
  const signatures = new Set<string>();
  for (const preset of PRESETS) {
    const source = presetPixels(preset.id);
    assert.equal(source.name, preset.title);
    assert.equal(source.width, preset.width);
    assert.equal(source.height, preset.height);
    assert.equal(source.pixels.length, source.width * source.height * 4);
    let filled = 0, empty = 0;
    for (let i = 3; i < source.pixels.length; i += 4) {
      assert.ok(source.pixels[i] === 0 || source.pixels[i] === 255);
      if (source.pixels[i]) filled++; else empty++;
    }
    assert.ok(filled > 50 && empty > 0, `${preset.title} is a bounded transparent pixel motif`);
    signatures.add(Buffer.from(source.pixels).toString('base64'));
  }
  assert.equal(signatures.size, PRESETS.length);
});

test('the original upload examples keep their source pixels and metadata', () => {
  assert.equal(EXAMPLES.length, 3);
  for (const example of EXAMPLES) assert.deepEqual(presetPixels(example.id), examplePixels(example.id));
});

test('all gallery sources generate complete editable charts for every supported brand', () => {
  for (const preset of PRESETS) for (const brand of Object.keys(PALETTES) as Brand[]) {
    const source = { ...presetPixels(preset.id), preview: '' };
    const colors = PALETTES[brand];
    const allowed = new Set(colors.map(c => c.code));
    const pattern = generatePattern(source, {
      brand, width: preset.width, height: preset.height,
      limit: 0, excluded: [], alphaThreshold: 127, background: 'transparent',
    }, colors);
    assert.equal(pattern.name, preset.title);
    assert.equal(pattern.brand, brand);
    assert.equal(pattern.cells.length, preset.width * preset.height);
    pattern.cells.forEach((cell, index) => {
      assert.ok(cell === null || allowed.has(cell));
      assert.equal(cell === null, source.pixels[index * 4 + 3] === 0);
    });
  }
});
