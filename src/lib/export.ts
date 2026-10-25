import { BRANDS, cssColor, PALETTES } from '../data/palettes';
import { countColors, paginateGrid } from './stats';
import { drawPattern } from './draw';
import { readableInk } from './color';
import type { Pattern } from './types';
import { getPngLayout } from './png';
export interface ExportOptions {
  format: 'png' | 'pdf';
  actualSize: boolean;
  pitch: number;
}
function safeName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '-').slice(0, 60) || '拼豆图纸';
}
function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function textCanvas(lines: string[], width = 1600, font = 32) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = lines.length * (font * 1.65) + 24;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#303236';
  ctx.font = `${font}px "PingFang SC","Microsoft YaHei",sans-serif`;
  lines.forEach((s, i) => ctx.fillText(s, 12, 12 + (i + 1) * font * 1.5));
  return c;
}
export async function exportPattern(pattern: Pattern, options: ExportOptions) {
  const counts = countColors(pattern),
    brand = BRANDS.find((b) => b.id === pattern.brand)!;
  const total = counts.reduce((n, c) => n + c.count, 0);
  if (options.format === 'png') {
    const layout = getPngLayout(pattern.width, pattern.height, counts.length);
    const c = document.createElement('canvas');
    c.width = layout.width;
    c.height = layout.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('无法创建高清图片，请使用分页 PDF');
    const { margin } = layout;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#303236';
    const fitText = (text: string, maxWidth: number) => {
      if (ctx.measureText(text).width <= maxWidth) return text;
      let short = text;
      while (short.length && ctx.measureText(`${short}…`).width > maxWidth)
        short = short.slice(0, -1);
      return `${short}…`;
    };
    ctx.font = `bold ${layout.titleFont}px sans-serif`;
    ctx.fillText(
      fitText(`${pattern.name} · 拼豆施工图`, c.width - margin * 2),
      margin,
      margin + layout.titleFont,
    );
    ctx.font = `${layout.metadataFont}px sans-serif`;
    ctx.fillText(
      `${brand.name} ${brand.series}   |   ${pattern.width} × ${pattern.height} 格   |   ${total} 颗 / ${counts.length} 色`,
      margin,
      margin + layout.titleFont + layout.metadataFont + 18,
    );
    // Re-render from cells directly at the final output resolution; no enlarged bitmap.
    ctx.save();
    ctx.translate(margin, layout.chartY);
    drawPattern(ctx, pattern, {
      cell: layout.cell,
      mode: 'chart',
      coordinates: true,
      crisp: true,
    });
    ctx.restore();
    counts.forEach((v, i) => {
      const columnWidth = (c.width - margin * 2) / 2;
      const x = margin + (i % 2) * columnWidth;
      const y = layout.legendY + Math.floor(i / 2) * layout.legendRowHeight;
      const swatch = layout.legendFont + 4;
      ctx.fillStyle = cssColor(v.color);
      ctx.fillRect(x, y - swatch + 4, swatch, swatch);
      ctx.fillStyle = '#303236';
      ctx.font = `500 ${layout.legendFont}px sans-serif`;
      ctx.fillText(
        fitText(
          `${v.label}  ${v.color.code}  ${v.color.name}  × ${v.count}`,
          columnWidth - swatch - 30,
        ),
        x + swatch + 14,
        y,
      );
    });
    ctx.fillStyle = '#73756f';
    ctx.font = `${layout.footerFont}px sans-serif`;
    ctx.fillText(
      '豆豆工坊 · 空白格不放豆 · 建议按原始大小查看编号 · 屏幕配色以实物为准',
      margin,
      layout.footerY,
    );
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        c.toBlob(
          (b) =>
            b ? resolve(b) : reject(new Error('PNG 导出失败，请使用分页 PDF')),
          'image/png',
        ),
      );
      save(blob, `${safeName(pattern.name)}-${brand.name}-图纸.png`);
    } finally {
      // Release the large pixel buffer after encoding.
      c.width = 0;
      c.height = 0;
    }
    return;
  }
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({
    title: `${pattern.name} - ${brand.name}`,
    creator: 'Bead Studio',
  });
  const addText = (
    lines: string[],
    x: number,
    y: number,
    w = 180,
    font = 32,
  ) => {
    const canvas = textCanvas(lines, 1600, font);
    const h = (canvas.height / canvas.width) * w;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, w, h);
    return h;
  };
  addText(
    [
      `${pattern.name} · 拼豆图纸`,
      `${brand.name}  ${brand.series}   ${pattern.width} × ${pattern.height} 格   ${total} 颗 / ${counts.length} 色`,
    ],
    15,
    12,
  );
  const preview = document.createElement('canvas');
  const cell = 12;
  preview.width = pattern.width * cell;
  preview.height = pattern.height * cell;
  drawPattern(preview.getContext('2d')!, pattern, { cell, mode: 'beads' });
  const scale = Math.min(170 / pattern.width, 195 / pattern.height);
  pdf.addImage(
    preview.toDataURL('image/png'),
    'PNG',
    (210 - pattern.width * scale) / 2,
    50,
    pattern.width * scale,
    pattern.height * scale,
  );
  addText(
    [
      '下一页开始为分页施工图；每格一颗豆，空白格不放豆。',
      '颜色为屏幕近似参考；用豆清单附于末尾。',
    ],
    15,
    258,
    180,
    26,
  );
  const gridCell = options.actualSize ? options.pitch : 6;
  const cols = Math.floor(174 / gridCell),
    rows = Math.floor(216 / gridCell);
  const pages = paginateGrid(pattern.width, pattern.height, cols, rows);
  const colors = new Map(PALETTES[pattern.brand].map((c) => [c.code, c]));
  const labels = new Map(counts.map((c) => [c.color.code, c.label]));
  pages.forEach((page, i) => {
    pdf.addPage();
    addText(
      [
        `${pattern.name} · 施工图 ${i + 1}/${pages.length}`,
        `${brand.name}   列 ${page.x + 1}–${page.x + page.width} / 行 ${page.y + 1}–${page.y + page.height}`,
      ],
      15,
      10,
    );
    const ox = 23,
      oy = 43;
    pdf.setFontSize(6);
    pdf.setTextColor('#777777');
    for (let x = 0; x < page.width; x++)
      pdf.text(String(page.x + x + 1), ox + (x + 0.5) * gridCell, oy - 2, {
        align: 'center',
      });
    for (let y = 0; y < page.height; y++)
      pdf.text(String(page.y + y + 1), ox - 2, oy + (y + 0.6) * gridCell, {
        align: 'right',
      });
    for (let y = 0; y < page.height; y++)
      for (let x = 0; x < page.width; x++) {
        const code = pattern.cells[(page.y + y) * pattern.width + page.x + x];
        if (!code) continue;
        const color = colors.get(code)!;
        pdf.setFillColor(...color.rgb);
        pdf.rect(ox + x * gridCell, oy + y * gridCell, gridCell, gridCell, 'F');
        pdf.setTextColor(readableInk(color.rgb));
        pdf.setFontSize(Math.min(7, gridCell * 1.4));
        pdf.text(
          labels.get(code)!,
          ox + (x + 0.5) * gridCell,
          oy + (y + 0.62) * gridCell,
          { align: 'center' },
        );
      }
    for (let x = 0; x <= page.width; x++) {
      const line = page.x + x;
      pdf.setDrawColor(
        line % 10 === 0 ? '#68685e' : line % 5 === 0 ? '#a4a393' : '#d8d7cd',
      );
      pdf.setLineWidth(line % 10 === 0 ? 0.35 : 0.12);
      pdf.line(
        ox + x * gridCell,
        oy,
        ox + x * gridCell,
        oy + page.height * gridCell,
      );
    }
    for (let y = 0; y <= page.height; y++) {
      const line = page.y + y;
      pdf.setDrawColor(
        line % 10 === 0 ? '#68685e' : line % 5 === 0 ? '#a4a393' : '#d8d7cd',
      );
      pdf.setLineWidth(line % 10 === 0 ? 0.35 : 0.12);
      pdf.line(
        ox,
        oy + y * gridCell,
        ox + page.width * gridCell,
        oy + y * gridCell,
      );
    }
    pdf.setDrawColor('#444444');
    pdf.setLineWidth(0.2);
    pdf.line(23, 270, 73, 270);
    pdf.line(23, 268, 23, 272);
    pdf.line(73, 268, 73, 272);
    pdf.setFontSize(8);
    pdf.setTextColor('#555555');
    pdf.text('50 mm', 48, 276, { align: 'center' });
    addText(
      [
        options.actualSize
          ? `等比例打印：钉距 ${gridCell}mm，请选择实际大小 / 100%，先核对左侧标尺。`
          : '阅读图纸：格距已放大便于识别；左侧为 50mm 打印校准标尺。',
      ],
      80,
      267,
      116,
      24,
    );
  });
  // Separate legend pages keep all rows readable and avoid overlapping the chart.
  for (let offset = 0; offset < Math.max(1, counts.length); offset += 24) {
    pdf.addPage();
    addText(
      [
        `${pattern.name} · 用豆清单`,
        `${brand.name} ${brand.series}    合计 ${total} 颗 / ${counts.length} 色`,
      ],
      15,
      12,
    );
    counts.slice(offset, offset + 24).forEach((v, i) => {
      const y = 45 + i * 8.5;
      pdf.setFillColor(...v.color.rgb);
      pdf.roundedRect(16, y, 5, 5, 1, 1, 'F');
      addText(
        [`${v.label}   ${v.color.code}   ${v.color.name}   × ${v.count}`],
        24,
        y - 1,
        170,
        30,
      );
    });
    addText(
      [
        '屏幕颜色为近似参考，以实体豆色卡为准。',
        '制作尺寸按垫板格距估算，熨烫后可能变化。',
      ],
      15,
      266,
      180,
      25,
    );
  }
  save(pdf.output('blob'), `${safeName(pattern.name)}-${brand.name}-图纸.pdf`);
}
