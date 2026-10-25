import type { RGB } from './types';
export function rgbToLab(rgb: RGB): RGB {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const xyz = [
    (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047,
    r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883,
  ];
  const [x, y, z] = xyz.map((v) =>
    v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116,
  );
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
export const distance = (a: RGB, b: RGB) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
export function readableInk(rgb: RGB) {
  return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 145
    ? '#303236'
    : '#ffffff';
}
