export type Brand = 'perler' | 'artkal' | 'hama';
export type RGB = readonly [number, number, number];
export interface BeadColor {
  code: string;
  name: string;
  rgb: RGB;
  contributor: string;
}
export interface SourceImage {
  name: string;
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  preview: string;
}
export interface Settings {
  brand: Brand;
  width: number;
  height: number;
  limit: number;
  excluded: string[];
  alphaThreshold: number;
  background: 'transparent' | 'white';
}
export interface Pattern {
  name: string;
  width: number;
  height: number;
  brand: Brand;
  cells: (string | null)[];
}
export interface ColorCount {
  color: BeadColor;
  count: number;
  label: string;
}
export type ViewMode = 'beads' | 'chart' | 'original';
export type EditTool = 'pan' | 'paint' | 'erase' | 'replace';
