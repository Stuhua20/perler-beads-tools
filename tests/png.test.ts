import test from 'node:test';
import assert from 'node:assert/strict';
import { getPngLayout, MAX_PNG_EDGE, MAX_PNG_PIXELS } from '../src/lib/png';

test('small PNG charts are re-rendered at twice the previous cell resolution', () => {
  const layout = getPngLayout(32, 32, 32);
  assert.equal(layout.cell, 96);
  assert.ok(layout.chartWidth >= 32 * 96);
});

test('all supported dimensions keep readable cells within the full-image pixel budget', () => {
  for (const width of [1, 32, 64, 96, 150, 199, 200]) {
    for (const height of [1, 32, 64, 96, 150, 199, 200]) {
      for (const colors of [0, 1, 16, 32]) {
        const l = getPngLayout(width, height, colors);
        assert.ok(l.width * l.height <= MAX_PNG_PIXELS);
        assert.ok(l.width <= MAX_PNG_EDGE && l.height <= MAX_PNG_EDGE);
        assert.ok(l.cell >= 24 && l.cell % 2 === 0);
        assert.ok(l.titleFont >= 32 && l.legendFont >= 20);
        assert.ok(l.margin + l.chartWidth <= l.width - l.margin);
        assert.ok(l.chartY + l.chartHeight < l.legendY);
        assert.ok(
          l.legendY + Math.ceil(colors / 2) * l.legendRowHeight < l.footerY,
        );
        assert.ok(l.footerY < l.height);
      }
    }
  }
});

test('layout budgets for the complete legend, not just the grid', () => {
  const empty = getPngLayout(96, 96, 0);
  const full = getPngLayout(96, 96, 32);
  assert.ok(full.cell <= empty.cell);
  assert.ok(full.legendRowHeight >= full.legendFont);
  assert.ok(full.width * full.height <= MAX_PNG_PIXELS);
});

test('an unsupported oversized image gives a PDF fallback instead of allocating huge canvases', () => {
  assert.throws(() => getPngLayout(1000, 1000, 32), /分页 PDF/);
});
