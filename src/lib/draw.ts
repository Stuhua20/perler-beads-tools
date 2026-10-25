import { PALETTES, cssColor } from '../data/palettes';
import { countColors } from './stats';
import { readableInk } from './color';
import type { Pattern, ViewMode } from './types';
export interface DrawOptions {
  cell: number;
  mode: ViewMode;
  coordinates?: boolean;
  highlight?: string | null;
  crisp?: boolean;
}
export function drawPattern(
  context: CanvasRenderingContext2D,
  pattern: Pattern,
  { cell, mode, coordinates = false, highlight, crisp = false }: DrawOptions,
) {
  const margin = coordinates ? cell : 0;
  const drawingWidth = crisp
    ? (pattern.width + (coordinates ? 1 : 0)) * cell + 8
    : context.canvas.width;
  const drawingHeight = crisp
    ? (pattern.height + (coordinates ? 1 : 0)) * cell + 8
    : context.canvas.height;
  context.clearRect(0, 0, drawingWidth, drawingHeight);
  context.fillStyle = crisp ? '#ffffff' : '#fffefb';
  context.fillRect(0, 0, drawingWidth, drawingHeight);
  const colors = new Map(PALETTES[pattern.brand].map((c) => [c.code, c]));
  const labels = new Map(
    countColors(pattern).map((c) => [c.color.code, c.label]),
  );
  for (let y = 0; y < pattern.height; y++)
    for (let x = 0; x < pattern.width; x++) {
      const code = pattern.cells[y * pattern.width + x],
        px = margin + x * cell,
        py = margin + y * cell;
      if (!code) {
        if (mode === 'beads') {
          context.fillStyle = (x + y) % 2 ? '#f5f4ee' : '#faf9f5';
          context.fillRect(px, py, cell, cell);
        }
        continue;
      }
      const color = colors.get(code)!;
      context.globalAlpha = highlight && highlight !== code ? 0.16 : 1;
      context.fillStyle = cssColor(color);
      if (mode === 'beads') {
        context.beginPath();
        context.roundRect(
          px + cell * 0.035,
          py + cell * 0.035,
          cell * 0.93,
          cell * 0.93,
          cell * 0.29,
        );
        context.fill();
        context.fillStyle = 'rgba(255,255,255,.28)';
        context.beginPath();
        context.ellipse(
          px + cell * 0.4,
          py + cell * 0.24,
          cell * 0.25,
          cell * 0.12,
          0,
          0,
          Math.PI * 2,
        );
        context.fill();
        context.fillStyle = 'rgba(42,32,20,.24)';
        context.beginPath();
        context.arc(
          px + cell * 0.51,
          py + cell * 0.52,
          cell * 0.125,
          0,
          Math.PI * 2,
        );
        context.fill();
      } else {
        context.fillRect(px, py, cell, cell);
        if (cell >= 13) {
          context.fillStyle = readableInk(color.rgb);
          context.font = crisp
            ? `600 ${Math.max(12, Math.round(cell * 0.34))}px sans-serif`
            : `500 ${Math.max(6, cell * 0.28)}px sans-serif`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(labels.get(code)!, px + cell / 2, py + cell / 2);
        }
      }
      context.globalAlpha = 1;
    }
  if (mode === 'chart' && crisp) {
    // Filled integer rectangles avoid fractional strokes straddling two pixels.
    const unit = Math.max(1, Math.round(cell / 48));
    for (let x = 0; x <= pattern.width; x++) {
      const thickness = unit * (x % 10 === 0 ? 3 : x % 5 === 0 ? 2 : 1);
      context.fillStyle =
        x % 10 === 0 ? '#77776c' : x % 5 === 0 ? '#a3a297' : '#c1c1b8';
      context.fillRect(
        margin + x * cell - Math.floor(thickness / 2),
        margin,
        thickness,
        pattern.height * cell,
      );
    }
    for (let y = 0; y <= pattern.height; y++) {
      const thickness = unit * (y % 10 === 0 ? 3 : y % 5 === 0 ? 2 : 1);
      context.fillStyle =
        y % 10 === 0 ? '#77776c' : y % 5 === 0 ? '#a3a297' : '#c1c1b8';
      context.fillRect(
        margin,
        margin + y * cell - Math.floor(thickness / 2),
        pattern.width * cell,
        thickness,
      );
    }
  }
  if (mode === 'chart' && !crisp) {
    for (let x = 0; x <= pattern.width; x++) {
      context.strokeStyle =
        x % 10 === 0 ? '#8c8b82' : x % 5 === 0 ? '#b3b1a6' : '#d8d5c9';
      context.lineWidth = x % 10 === 0 ? 1.3 : 0.6;
      context.beginPath();
      context.moveTo(margin + x * cell, margin);
      context.lineTo(margin + x * cell, margin + pattern.height * cell);
      context.stroke();
    }
    for (let y = 0; y <= pattern.height; y++) {
      context.strokeStyle =
        y % 10 === 0 ? '#8c8b82' : y % 5 === 0 ? '#b3b1a6' : '#d8d5c9';
      context.lineWidth = y % 10 === 0 ? 1.3 : 0.6;
      context.beginPath();
      context.moveTo(margin, margin + y * cell);
      context.lineTo(margin + pattern.width * cell, margin + y * cell);
      context.stroke();
    }
  }
  if (coordinates) {
    context.fillStyle = crisp ? '#595d60' : '#77786f';
    context.font = crisp
      ? `500 ${Math.max(12, Math.round(cell * 0.32))}px sans-serif`
      : `${Math.max(8, cell * 0.32)}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (let x = 0; x < pattern.width; x++)
      if (x === 0 || (x + 1) % 5 === 0)
        context.fillText(String(x + 1), margin + (x + 0.5) * cell, cell * 0.5);
    for (let y = 0; y < pattern.height; y++)
      if (y === 0 || (y + 1) % 5 === 0)
        context.fillText(String(y + 1), cell * 0.45, margin + (y + 0.5) * cell);
  }
}
