/** Bound the complete image, including its color legend, before allocating a canvas. */
export const MAX_PNG_PIXELS = 32_000_000;
export const MAX_PNG_EDGE = 8192;
export function getPngLayout(
  width: number,
  height: number,
  colorCount: number,
) {
  for (let cell = 96; cell >= 24; cell -= 2) {
    const margin = cell;
    const chartWidth = (width + 1) * cell + 8;
    const chartHeight = (height + 1) * cell + 8;
    const imageWidth = Math.max(1280, chartWidth + margin * 2);
    const titleFont = Math.max(32, Math.round(imageWidth * 0.016));
    const metadataFont = Math.max(20, Math.round(imageWidth * 0.009));
    const legendFont = metadataFont;
    const footerFont = Math.max(18, Math.round(imageWidth * 0.007));
    const chartY = margin + titleFont + metadataFont + 48;
    const legendY = chartY + chartHeight + legendFont * 2;
    const legendRowHeight = Math.ceil(legendFont * 1.7);
    const footerY =
      legendY + Math.ceil(colorCount / 2) * legendRowHeight + footerFont * 2;
    const imageHeight = footerY + margin;
    if (
      imageWidth <= MAX_PNG_EDGE &&
      imageHeight <= MAX_PNG_EDGE &&
      imageWidth * imageHeight <= MAX_PNG_PIXELS
    ) {
      return {
        cell,
        margin,
        width: imageWidth,
        height: imageHeight,
        chartWidth,
        chartHeight,
        chartY,
        titleFont,
        metadataFont,
        legendFont,
        legendY,
        legendRowHeight,
        footerFont,
        footerY,
      };
    }
  }
  throw new Error('图纸过大，无法清晰地导出单张 PNG，请使用分页 PDF');
}
