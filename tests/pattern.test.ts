import test from 'node:test';
import assert from 'node:assert/strict';
import { PALETTES } from '../src/data/palettes';
import { generatePattern } from '../src/lib/process';
import { countColors, paginateGrid } from '../src/lib/stats';
import { rgbToLab } from '../src/lib/color';
import type { Settings, Brand, RGB } from '../src/lib/types';
const settings: Settings = {
  brand: 'perler',
  width: 2,
  height: 2,
  limit: 0,
  excluded: [],
  alphaThreshold: 127,
  background: 'transparent',
};
function source(pixels: number[], width = 2, height = 2) {
  return {
    name: 'fixture',
    width,
    height,
    pixels: new Uint8ClampedArray(pixels),
  };
}
test('each brand has 32 distinct real codes and valid RGB triplets', () => {
  for (const [brand, colors] of Object.entries(PALETTES)) {
    assert.equal(colors.length, 32);
    assert.equal(new Set(colors.map((c) => c.code)).size, 32);
    for (const color of colors) {
      assert.equal(color.rgb.length, 3);
      assert.ok(
        color.rgb.every((n) => Number.isInteger(n) && n >= 0 && n <= 255),
      );
      assert.match(
        color.code,
        brand === 'perler'
          ? /^80-\d{5}$/
          : brand === 'artkal'
            ? /^S\d+$/
            : /^\d{2}$/,
      );
    }
  }
});
test('transparent and opaque white remain different; per-color sum excludes blanks', () => {
  const s = source([
    0, 0, 0, 0, 234, 239, 238, 255, 50, 50, 52, 255, 0, 0, 0, 50,
  ]);
  const p = generatePattern(s, settings, PALETTES.perler);
  assert.deepEqual(p.cells, [null, '80-19001', '80-19018', null]);
  const counts = countColors(p);
  assert.equal(
    counts.reduce((n, c) => n + c.count, 0),
    2,
  );
});
test('white background composites fully transparent RGB instead of reading hidden colors', () => {
  const p = generatePattern(
    source([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    { ...settings, background: 'white' },
    PALETTES.perler,
  );
  assert.ok(p.cells.every((code) => code === '80-19001'));
});
test('all matching happens within the requested brand and excludes unavailable colors', () => {
  const s = source([
    234, 239, 238, 255, 50, 50, 52, 255, 231, 206, 62, 255, 77, 171, 100, 255,
  ]);
  for (const brand of Object.keys(PALETTES) as Brand[]) {
    const excluded = [PALETTES[brand][0].code];
    const p = generatePattern(
      s,
      { ...settings, brand, excluded },
      PALETTES[brand],
    );
    assert.equal(p.brand, brand);
    assert.ok(
      p.cells.every(
        (code) =>
          PALETTES[brand].some((c) => c.code === code) &&
          !excluded.includes(code!),
      ),
    );
  }
});
test('limit 16 and 24 applies to real color choices without introducing other colors', () => {
  const colors = PALETTES.artkal;
  const pixels = colors.flatMap((c) => [...c.rgb, 255]);
  for (const limit of [16, 24]) {
    const p = generatePattern(
      source(pixels, 32, 1),
      { ...settings, brand: 'artkal', width: 32, height: 1, limit },
      colors,
    );
    assert.equal(countColors(p).length, limit);
    assert.equal(p.cells.length, 32);
  }
});
test('nearest neighbour resampling keeps source pixels sharp', () => {
  const p = generatePattern(
    source([234, 239, 238, 255, 50, 50, 52, 255], 2, 1),
    { ...settings, width: 4, height: 2 },
    PALETTES.perler,
  );
  assert.deepEqual(p.cells, [
    '80-19001',
    '80-19001',
    '80-19018',
    '80-19018',
    '80-19001',
    '80-19001',
    '80-19018',
    '80-19018',
  ]);
});
test('all-transparent images are a valid empty pattern', () => {
  const p = generatePattern(
    source(new Array(16).fill(0)),
    { ...settings, limit: 16 },
    PALETTES.perler,
  );
  assert.deepEqual(countColors(p), []);
  assert.equal(p.cells.filter(Boolean).length, 0);
});
test('invalid dimensions and empty allowed palette are rejected', () => {
  const s = source(new Array(16).fill(255));
  for (const width of [0, 201, NaN, 1.5])
    assert.throws(() =>
      generatePattern(s, { ...settings, width }, PALETTES.perler),
    );
  assert.throws(() =>
    generatePattern(
      s,
      { ...settings, excluded: PALETTES.perler.map((c) => c.code) },
      PALETTES.perler,
    ),
  );
});
test('pagination covers every cell exactly once across boundaries', () => {
  for (const [width, height] of [
    [1, 1],
    [32, 32],
    [58, 72],
    [200, 200],
  ]) {
    const covered = new Set<number>();
    const pages = paginateGrid(width, height, 29, 36);
    for (const p of pages)
      for (let y = p.y; y < p.y + p.height; y++)
        for (let x = p.x; x < p.x + p.width; x++) {
          const i = y * width + x;
          assert.ok(!covered.has(i));
          covered.add(i);
        }
    assert.equal(covered.size, width * height);
  }
});
test('Lab white and black use standard perceptual lightness', () => {
  for (const [rgb, target] of [
    [[255, 255, 255], 100],
    [[0, 0, 0], 0],
  ] as [RGB, number][])
    assert.ok(Math.abs(rgbToLab(rgb)[0] - target) < 0.001);
});
