import type { SourceImage } from '../lib/types';
export type ExampleId = 'daisy' | 'berry' | 'toast';
export const EXAMPLES: {
  id: ExampleId;
  title: string;
  description: string;
  detail: string;
  tone: string;
}[] = [
  {
    id: 'daisy',
    title: '小雏菊',
    description: '从一朵小花开始，',
    detail: '把温柔拼进生活。',
    tone: 'cream',
  },
  {
    id: 'berry',
    title: '草莓心情',
    description: '酸酸甜甜，',
    detail: '把好心情拼成实物。',
    tone: 'pink',
  },
  {
    id: 'toast',
    title: '吐司朋友',
    description: '简单的快乐，',
    detail: '从一片吐司开始。',
    tone: 'blue',
  },
];
export function examplePixels(id: ExampleId): Omit<SourceImage, 'preview'> {
  const n = 32,
    pixels = new Uint8ClampedArray(n * n * 4);
  const set = (x: number, y: number, hex: string) => {
    if (x < 0 || y < 0 || x >= n || y >= n) return;
    const i = (y * n + x) * 4;
    pixels.set(
      [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
        255,
      ],
      i,
    );
  };
  const ellipse = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: string,
  ) => {
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) set(x, y, color);
  };
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    for (let py = y; py < y + h; py++)
      for (let px = x; px < x + w; px++) set(px, py, c);
  };
  if (id === 'daisy') {
    rect(15, 15, 2, 12, '#397948');
    ellipse(11, 23, 4, 2, '#71aa62');
    ellipse(20, 21, 4, 2, '#55954f');
    rect(13, 23, 3, 1, '#397948');
    rect(17, 21, 3, 1, '#397948');
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      ellipse(
        Math.round(15.5 + Math.cos(a) * 6),
        Math.round(11 + Math.sin(a) * 6),
        3.5,
        3.5,
        k % 2 ? '#fffdfa' : '#eaeFEE',
      );
    }
    ellipse(15.5, 11, 4.4, 4.3, '#f7b747');
    ellipse(15, 10, 3.2, 3.1, '#f4d266');
    rect(15, 9, 1, 1, '#fff0aa');
    rect(10, 26, 12, 2, '#d57758');
    rect(11, 28, 10, 3, '#e9bfb9');
    rect(12, 31, 8, 1, '#e19495');
    rect(12, 28, 2, 3, '#e9bfb9');
  } else if (id === 'berry') {
    for (let y = 9; y <= 28; y++) {
      const half = y < 14 ? 9 : Math.max(1, Math.round((29 - y) * 0.62));
      for (let x = 16 - half; x <= 16 + half; x++)
        set(x, y, x < 14 ? '#ed9da2' : x > 21 ? '#ad3547' : '#dc595b');
    }
    ellipse(13, 9, 5, 3, '#dc595b');
    ellipse(20, 9, 5, 3, '#dc595b');
    [
      [11, 13],
      [19, 12],
      [15, 17],
      [22, 17],
      [10, 19],
      [19, 22],
      [15, 26],
    ].forEach(([x, y]) => rect(x, y, 1, 2, '#fff1bd'));
    rect(15, 3, 2, 5, '#397948');
    ellipse(12, 7, 5, 2, '#69a861');
    ellipse(20, 7, 5, 2, '#397948');
    ellipse(16, 9, 2, 4, '#528c49');
  } else {
    ellipse(16, 10, 11, 7, '#a36643');
    rect(5, 10, 23, 19, '#a36643');
    rect(7, 28, 19, 2, '#a36643');
    ellipse(16, 11, 9, 6, '#f6ca83');
    rect(7, 11, 19, 16, '#f6ca83');
    rect(9, 10, 15, 16, '#f6dfad');
    rect(8, 12, 2, 12, '#f6dfad');
    rect(11, 19, 2, 2, '#503e39');
    rect(21, 19, 2, 2, '#503e39');
    rect(15, 22, 1, 1, '#503e39');
    rect(16, 23, 3, 1, '#503e39');
    rect(19, 22, 1, 1, '#503e39');
    rect(9, 22, 3, 1, '#e99d9c');
    rect(22, 22, 3, 1, '#e99d9c');
  }
  return {
    name: EXAMPLES.find((e) => e.id === id)!.title,
    width: n,
    height: n,
    pixels,
  };
}
export function loadExample(id: ExampleId): SourceImage {
  const source = examplePixels(id);
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d')!;
  context.putImageData(
    new ImageData(new Uint8ClampedArray(source.pixels), 32, 32),
    0,
    0,
  );
  return { ...source, preview: canvas.toDataURL('image/png') };
}
