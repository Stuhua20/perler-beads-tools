import { PALETTES } from '../data/palettes';
import type { Pattern, ColorCount } from './types';
export function countColors(pattern: Pattern): ColorCount[] {
  const counts = new Map<string, number>();
  for (const code of pattern.cells)
    if (code !== null) counts.set(code, (counts.get(code) ?? 0) + 1);
  return PALETTES[pattern.brand]
    .filter((c) => counts.has(c.code))
    .map((color, i) => ({
      color,
      count: counts.get(color.code)!,
      label: `A${String(i + 1).padStart(2, '0')}`,
    }));
}
export function paginateGrid(
  width: number,
  height: number,
  columns: number,
  rows: number,
) {
  if (columns < 1 || rows < 1) throw new Error('无效分页尺寸');
  const pages = [];
  for (let y = 0; y < height; y += rows)
    for (let x = 0; x < width; x += columns)
      pages.push({
        x,
        y,
        width: Math.min(columns, width - x),
        height: Math.min(rows, height - y),
      });
  return pages;
}
