import type { SourceImage } from './types';
export async function readImage(file: File): Promise<SourceImage> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('请选择 PNG、JPG 或 WebP 图片');
  if (file.size > 20 * 1024 * 1024) throw new Error('图片不能超过 20MB');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('图片无法解码，请换一张图片');
  }
  try {
    if (bitmap.width * bitmap.height > 25_000_000)
      throw new Error('图片不能超过 2500 万像素，请先缩小图片');
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    // Keep only a compact preview URL in React state.
    const previewCanvas = document.createElement('canvas');
    const scale = Math.min(1, 320 / Math.max(canvas.width, canvas.height));
    previewCanvas.width = Math.max(1, Math.round(canvas.width * scale));
    previewCanvas.height = Math.max(1, Math.round(canvas.height * scale));
    const previewContext = previewCanvas.getContext('2d')!;
    previewContext.imageSmoothingEnabled = false;
    previewContext.drawImage(
      canvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
    );
    return {
      name: file.name.replace(/\.[^.]+$/, ''),
      width: canvas.width,
      height: canvas.height,
      pixels,
      preview: previewCanvas.toDataURL('image/png'),
    };
  } finally {
    bitmap.close();
  }
}
