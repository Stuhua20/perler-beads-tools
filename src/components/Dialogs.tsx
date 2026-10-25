import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  X,
  Download,
  FileText,
  Check,
  ExternalLink,
  Palette,
  Grid2X2,
  ImagePlus,
} from 'lucide-react';
import { BRANDS, PALETTES, cssColor } from '../data/palettes';
import type { Brand, Pattern } from '../lib/types';
import { exportPattern } from '../lib/export';
export function Modal({
  title,
  onClose,
  children,
  wide = false,
  drawer = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  drawer?: boolean;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement)
        trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''} ${drawer ? 'drawer' : ''}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" aria-label="关闭弹窗" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ExportDialog({
  pattern,
  initialFormat,
  pendingSettings = false,
  onClose,
  onSuccess,
}: {
  pattern: Pattern;
  initialFormat: 'png' | 'pdf';
  pendingSettings?: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [format, setFormat] = useState(initialFormat),
    [actualSize, setActualSize] = useState(false),
    [pitch, setPitch] = useState(5),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const download = async () => {
    setBusy(true);
    setError('');
    try {
      await exportPattern(pattern, { format, actualSize, pitch });
      onSuccess(`${format.toUpperCase()} 图纸已下载`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败，请重试');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="把作品带回家"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="modal-subtitle">下载当前预览的图纸，开始你的手作时光。</p>
      {pendingSettings ? (
        <p className="export-pending" role="status">设置尚未应用：本次下载为当前画布的 {pattern.width} × {pattern.height} 格图纸，保留画布中的编辑内容。</p>
      ) : null}
      <div className="format-options">
        {(['png', 'pdf'] as const).map((f) => (
          <button
            key={f}
            className={format === f ? 'selected' : ''}
            onClick={() => setFormat(f)}
          >
            {f === 'png' ? <Download size={23} /> : <FileText size={23} />}
            <strong>{f.toUpperCase()} 图纸</strong>
            <span>
              {f === 'png' ? '高清长图，查看与分享' : 'A4 分页，清晰打印'}
            </span>
            {format === f ? <Check className="format-check" size={15} /> : null}
          </button>
        ))}
      </div>
      {format === 'pdf' ? (
        <div className="print-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={actualSize}
              onChange={(e) => setActualSize(e.target.checked)}
            />
            等比例垫板打印
          </label>
          {actualSize ? (
            <label className="pitch-input">
              垫板钉距{' '}
              <input
                aria-label="垫板钉距"
                type="number"
                min={2}
                max={10}
                step={0.1}
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
              />{' '}
              mm
            </label>
          ) : null}
          <p>
            {actualSize
              ? '选择“实际大小 / 100%”打印，先核对 PDF 中的 50mm 校准标尺。'
              : '图纸按可读字号分页，并附总览与完整用豆清单。'}
          </p>
        </div>
      ) : (
        <p className="export-description">
          包含网格、坐标、颜色标记和完整用豆清单。建议按 100% 原始大小查看编号。
        </p>
      )}
      <div className="export-summary">
        <span>{pattern.name}</span>
        <span>
          {BRANDS.find((b) => b.id === pattern.brand)!.name} · {pattern.width} ×{' '}
          {pattern.height} 格
        </span>
      </div>
      {error ? (
        <p role="alert" className="error-message">
          {error}
        </p>
      ) : null}
      <button
        className="button primary modal-download"
        disabled={busy || pitch < 2 || pitch > 10 || !Number.isFinite(pitch)}
        onClick={() => void download()}
      >
        <Download size={17} />
        {busy ? '正在打包你的作品…' : `下载 ${format.toUpperCase()} 图纸`}
      </button>
    </Modal>
  );
}
export function PaletteDialog({
  initialBrand,
  onClose,
}: {
  initialBrand: Brand;
  onClose: () => void;
}) {
  const [brand, setBrand] = useState(initialBrand);
  const current = BRANDS.find((b) => b.id === brand)!;
  return (
    <Modal title="找到你手中的豆色" onClose={onClose} wide>
      <p className="modal-subtitle">
        每个品牌收录 32 个常用基础实色，色号相互独立。
      </p>
      <div className="segmented palette-tabs">
        {BRANDS.map((b) => (
          <button
            key={b.id}
            className={brand === b.id ? 'selected' : ''}
            onClick={() => setBrand(b.id)}
          >
            {b.name}
          </button>
        ))}
      </div>
      <div className="reference-grid">
        {PALETTES[brand].map((c) => (
          <div className="reference-color" key={c.code}>
            <span className="bead-swatch" style={{ background: cssColor(c) }} />
            <strong>{c.code}</strong>
            <small>{c.name}</small>
          </div>
        ))}
      </div>
      <div className="palette-source">
        <p>
          RGB 来自 BeadColors 社区参考数据，屏幕显示与实物可能存在差异。系列：
          {current.series}。
        </p>
        <a href={current.source} target="_blank" rel="noreferrer">
          查看品牌参考 <ExternalLink size={12} />
        </a>
        <a
          href="https://github.com/maxcleme/beadcolors"
          target="_blank"
          rel="noreferrer"
        >
          数据来源 <ExternalLink size={12} />
        </a>
      </div>
    </Modal>
  );
}
export function GuideDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="第一张图纸，从这里开始" onClose={onClose}>
      <div className="guide-steps">
        <div>
          <ImagePlus />
          <section>
            <h3>第一步：选择图片</h3>
            <p>上传 PNG、JPG 或 WebP，也可以选择示例。确认图片后，点击“下一步：调整图纸”。</p>
          </section>
        </div>
        <div>
          <Palette />
          <section>
            <h3>第二步：调整与编辑</h3>
            <p>选择拼豆品牌，调整格数和颜色数量，再点击“更新图纸”。画笔、擦除和整色替换用于手动微调，可撤销或重做。</p>
          </section>
        </div>
        <div>
          <Grid2X2 />
          <section>
            <h3>下载当前图纸</h3>
            <p>
              右上角“下载图纸”可选择 PNG 或 PDF。下载与当前画布一致；尚未应用的设置不会改变下载内容。打印 PDF 时先核对标尺。
            </p>
          </section>
        </div>
      </div>
      <button className="button primary modal-download" onClick={onClose}>
        开始我的第一份创作
      </button>
    </Modal>
  );
}
