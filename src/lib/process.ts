import type { BeadColor, Pattern, Settings, SourceImage, RGB } from './types';
import { distance, rgbToLab } from './color';

/** Nearest-neighbour sampling preserves pixel artwork. Alpha is decided before RGB matching. */
export function generatePattern(
  source: Pick<SourceImage, 'name' | 'width' | 'height' | 'pixels'>,
  settings: Settings,
  colors: BeadColor[],
): Pattern {
  const { width, height } = settings;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 200 ||
    height > 200
  )
    throw new Error('图纸宽高需为 1–200 格的整数');
  const available = colors.filter((c) => !settings.excluded.includes(c.code));
  if (!available.length) throw new Error('请至少保留一种可用颜色');
  const labs = available.map((c) => rgbToLab(c.rgb));
  const cache = new Map<number, number>();
  const histogram = new Map<
    number,
    { lab: RGB; count: number; nearest: number }
  >();
  const pixels: (number | null)[] = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const sx = Math.min(
        source.width - 1,
        Math.floor(((x + 0.5) * source.width) / width),
      );
      const sy = Math.min(
        source.height - 1,
        Math.floor(((y + 0.5) * source.height) / height),
      );
      const i = (sy * source.width + sx) * 4,
        alpha = source.pixels[i + 3];
      if (
        settings.background === 'transparent' &&
        alpha <= settings.alphaThreshold
      ) {
        pixels.push(null);
        continue;
      }
      const a = settings.background === 'white' ? alpha / 255 : 1;
      const rgb: RGB = [
        Math.round(source.pixels[i] * a + 255 * (1 - a)),
        Math.round(source.pixels[i + 1] * a + 255 * (1 - a)),
        Math.round(source.pixels[i + 2] * a + 255 * (1 - a)),
      ];
      const key = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
      let nearest = cache.get(key);
      if (nearest === undefined) {
        const lab = rgbToLab(rgb);
        nearest = 0;
        for (let j = 1; j < labs.length; j++)
          if (distance(lab, labs[j]) < distance(lab, labs[nearest]))
            nearest = j;
        cache.set(key, nearest);
        histogram.set(key, { lab, count: 0, nearest });
      }
      histogram.get(key)!.count++;
      pixels.push(key);
    }
  const candidates = [
    ...new Set([...histogram.values()].map((v) => v.nearest)),
  ];
  let chosen = candidates;
  if (settings.limit > 0 && candidates.length > settings.limit) {
    // Greedily minimize the weighted perceptual error of the entire image.
    chosen = [];
    const errors = new Map<number, number>();
    for (const key of histogram.keys()) errors.set(key, Infinity);
    while (chosen.length < settings.limit) {
      let best = -1,
        bestError = Infinity;
      for (const candidate of candidates) {
        if (chosen.includes(candidate)) continue;
        let total = 0;
        for (const [key, h] of histogram)
          total +=
            h.count *
            Math.min(errors.get(key)!, distance(h.lab, labs[candidate]));
        if (total < bestError) {
          bestError = total;
          best = candidate;
        }
      }
      chosen.push(best);
      for (const [key, h] of histogram)
        errors.set(
          key,
          Math.min(errors.get(key)!, distance(h.lab, labs[best])),
        );
    }
  }
  const mapping = new Map<number, string>();
  for (const [key, h] of histogram) {
    let nearest = chosen[0];
    for (const c of chosen)
      if (distance(h.lab, labs[c]) < distance(h.lab, labs[nearest]))
        nearest = c;
    mapping.set(key, available[nearest].code);
  }
  return {
    name: source.name,
    width,
    height,
    brand: settings.brand,
    cells: pixels.map((key) => (key === null ? null : mapping.get(key)!)),
  };
}
