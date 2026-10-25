import perler from './perler.json';
import artkal from './artkal.json';
import hama from './hama.json';
import type { Brand, BeadColor } from '../lib/types';
export const BRANDS: {
  id: Brand;
  name: string;
  series: string;
  tone: string;
  source: string;
}[] = [
  {
    id: 'perler',
    name: 'Perler',
    series: 'Standard · 5mm',
    tone: '#ffd84d',
    source: 'https://perler.com/collections/shop-by-color',
  },
  {
    id: 'artkal',
    name: 'Artkal',
    series: 'S 系列 · 5mm',
    tone: '#f0a4b2',
    source: 'https://www.artkalfusebeads.com/pages/s-color-chart',
  },
  {
    id: 'hama',
    name: 'Hama',
    series: 'Midi · 5mm',
    tone: '#8bc6de',
    source: 'https://www.hama.dk/',
  },
];
function typedColors(
  rows: { code: string; name: string; rgb: number[]; contributor: string }[],
): BeadColor[] {
  return rows.map((c) => ({ ...c, rgb: [c.rgb[0], c.rgb[1], c.rgb[2]] }));
}
export const PALETTES: Record<Brand, BeadColor[]> = {
  perler: typedColors(perler),
  artkal: typedColors(artkal),
  hama: typedColors(hama),
};
export const cssColor = (color: BeadColor) => `rgb(${color.rgb.join(',')})`;
