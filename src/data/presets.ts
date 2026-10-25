import { EXAMPLES, examplePixels, loadExample } from './examples';
import type { ExampleId } from './examples';
import type { SourceImage } from '../lib/types';

export type PresetId = ExampleId | 'coffee' | 'cat' | 'star' | 'rabbit' | 'flower';
export interface Preset {
  id: PresetId;
  title: string;
  tone: 'cream' | 'pink' | 'blue' | 'green';
  width: number;
  height: number;
}
export const PRESETS: Preset[] = [
  { id: 'daisy', title: '小雏菊', tone: 'cream', width: 32, height: 32 },
  { id: 'berry', title: '草莓心情', tone: 'pink', width: 32, height: 32 },
  { id: 'toast', title: '吐司朋友', tone: 'cream', width: 32, height: 32 },
  { id: 'coffee', title: '午后咖啡', tone: 'blue', width: 32, height: 32 },
  { id: 'cat', title: '小猫朋友', tone: 'cream', width: 32, height: 32 },
  { id: 'star', title: '星星心愿', tone: 'blue', width: 32, height: 32 },
  { id: 'rabbit', title: '兔兔花园', tone: 'green', width: 32, height: 32 },
  { id: 'flower', title: '花开正好', tone: 'pink', width: 32, height: 32 },
];

// Both the gallery thumbnail and the editable chart are made from these pixels.
export function presetPixels(id: PresetId): Omit<SourceImage, 'preview'> {
  const original = EXAMPLES.find((example) => example.id === id);
  if (original) return examplePixels(original.id);
  const pixels = new Uint8ClampedArray(32 * 32 * 4);
  const set = (x: number, y: number, hex: string | null) => {
    if (x < 0 || y < 0 || x >= 32 || y >= 32) return;
    pixels.set(hex ? [
      parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255,
    ] : [0, 0, 0, 0], (y * 32 + x) * 4);
  };
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) set(px, py, color);
  };
  const ellipse = (cx: number, cy: number, rx: number, ry: number, color: string | null) => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) set(x, y, color);
    }
  };
  const polygon = (points: [number, number][], color: string) => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) set(x, y, color);
    }
  };
  const ink = '#503e39', pink = '#e99d9c', white = '#fffdfa', green = '#55954f';
  if (id === 'coffee') {
    ellipse(16, 28, 13, 2, '#a36643');
    ellipse(16, 27, 11, 1, '#dfb78a');
    ellipse(25, 18, 5, 6, '#a36643');
    ellipse(25, 18, 3, 4, null);
    rect(6, 12, 18, 11, '#a36643');
    ellipse(15, 23, 9, 4, '#a36643');
    rect(8, 14, 14, 9, '#f6dfad');
    ellipse(15, 22, 7, 3, '#f6dfad');
    rect(8, 14, 3, 7, white);
    ellipse(15, 12, 9, 3, '#dfb78a');
    ellipse(15, 12, 7, 2, '#795340');
    rect(11, 18, 2, 2, ink); rect(18, 18, 2, 2, ink);
    rect(14, 21, 3, 1, ink); rect(9, 21, 2, 1, pink); rect(20, 21, 2, 1, pink);
    rect(10, 4, 2, 3, '#d2c6b9'); rect(12, 2, 2, 3, '#d2c6b9');
    rect(18, 6, 2, 3, '#d2c6b9'); rect(20, 3, 2, 3, '#d2c6b9');
  } else if (id === 'cat') {
    ellipse(26, 24, 4, 6, '#d58b43'); ellipse(26, 22, 2, 4, null);
    ellipse(16, 25, 7, 6, '#e6a649'); ellipse(16, 26, 4, 4, '#f6dfad');
    polygon([[6, 14], [6, 2], [15, 10]], '#d58b43');
    polygon([[17, 10], [26, 2], [26, 14]], '#d58b43');
    polygon([[8, 11], [8, 5], [13, 10]], pink);
    polygon([[19, 10], [24, 5], [24, 11]], pink);
    ellipse(16, 14, 11, 9, '#e6a649'); ellipse(16, 17, 8, 5, '#f6dfad');
    rect(12, 13, 2, 3, ink); rect(20, 13, 2, 3, ink);
    rect(16, 17, 2, 1, pink); rect(15, 19, 1, 1, ink); rect(18, 19, 1, 1, ink);
    rect(8, 17, 3, 1, pink); rect(23, 17, 2, 1, pink);
    rect(13, 6, 1, 3, '#b97840'); rect(16, 5, 1, 4, '#b97840'); rect(19, 6, 1, 3, '#b97840');
    rect(10, 29, 4, 2, '#f6dfad'); rect(19, 29, 4, 2, '#f6dfad');
  } else if (id === 'star') {
    polygon([[16, 1], [21, 10], [31, 12], [24, 20], [26, 31], [16, 26], [6, 31], [8, 20], [1, 12], [11, 10]], '#efb747');
    polygon([[16, 4], [20, 12], [27, 13], [21, 19], [23, 27], [16, 23], [9, 27], [11, 19], [5, 13], [13, 12]], '#f4d266');
    rect(11, 15, 2, 3, ink); rect(20, 15, 2, 3, ink);
    rect(15, 20, 3, 1, ink); rect(9, 19, 3, 1, pink); rect(22, 19, 3, 1, pink);
    rect(15, 8, 2, 3, '#fff0aa');
  } else if (id === 'rabbit') {
    rect(2, 29, 28, 3, green); rect(4, 25, 1, 5, '#397948'); rect(28, 22, 1, 8, '#397948');
    ellipse(4, 24, 3, 2, pink); rect(4, 24, 1, 1, '#f4d266');
    ellipse(28, 21, 3, 2, pink); rect(28, 21, 1, 1, '#f4d266');
    ellipse(12, 8, 3, 8, '#d8e2df'); ellipse(20, 8, 3, 8, '#d8e2df');
    ellipse(12, 8, 2, 7, white); ellipse(20, 8, 2, 7, white);
    ellipse(12, 7, 1, 4, pink); ellipse(20, 7, 1, 4, pink);
    ellipse(16, 25, 7, 6, '#d8e2df'); ellipse(16, 24, 6, 5, white);
    ellipse(16, 17, 9, 7, '#d8e2df'); ellipse(16, 16, 8, 6, white);
    rect(12, 15, 2, 2, ink); rect(20, 15, 2, 2, ink);
    rect(16, 18, 2, 1, pink); rect(16, 19, 1, 1, ink);
    rect(9, 18, 3, 1, pink); rect(22, 18, 2, 1, pink);
    rect(11, 28, 3, 2, white); rect(19, 28, 3, 2, white);
    rect(2, 28, 1, 2, '#71aa62'); rect(25, 27, 1, 3, '#71aa62'); rect(30, 27, 1, 3, '#71aa62');
  } else if (id === 'flower') {
    rect(15, 16, 2, 16, '#397948');
    ellipse(11, 25, 5, 2, '#71aa62'); ellipse(21, 23, 5, 2, green);
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;
      ellipse(Math.round(16 + Math.cos(a) * 6), Math.round(11 + Math.sin(a) * 6), 4, 4, k % 2 ? '#e99d9c' : '#dc595b');
    }
    ellipse(16, 11, 4, 4, '#efb747'); ellipse(15, 10, 3, 3, '#f4d266');
    rect(14, 9, 2, 1, '#fff0aa');
  }
  return { name: PRESETS.find((preset) => preset.id === id)!.title, width: 32, height: 32, pixels };
}

export function loadPreset(id: PresetId): SourceImage {
  const original = EXAMPLES.find((example) => example.id === id);
  if (original) return loadExample(original.id);
  const source = presetPixels(id);
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(source.pixels), source.width, source.height), 0, 0);
  return { ...source, preview: canvas.toDataURL('image/png') };
}
