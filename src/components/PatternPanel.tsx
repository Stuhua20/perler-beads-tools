import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Hand,
  Paintbrush,
  Eraser,
  Replace,
  Undo2,
  Redo2,
  ListChecks,
  AlertCircle,
  MousePointer2,
} from 'lucide-react';
import type { ActiveStudio } from '../lib/useStudio';
import type { EditTool, ViewMode } from '../lib/types';
import { BRANDS, PALETTES, cssColor } from '../data/palettes';
import { countColors } from '../lib/stats';
import { drawPattern } from '../lib/draw';
import { Modal } from './Dialogs';
export function PatternPanel({ studio }: { studio: ActiveStudio }) {
  const { busy } = studio;
  const { pattern, selection } = studio.current;
  const [mode, setMode] = useState<ViewMode>('beads'),
    [tool, setTool] = useState<EditTool>('pan'),
    [zoom, setZoom] = useState(1),
    [showList, setShowList] = useState(false),
    [hover, setHover] = useState<string | null>(null),
    [selected, setSelected] = useState(''),
    [viewport, setViewport] = useState({ width: 500, height: 370 });
  const canvas = useRef<HTMLCanvasElement>(null),
    scrollArea = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; y: number; left: number; top: number } | null>(
      null,
    );
  const counts = useMemo(() => countColors(pattern), [pattern]);
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const colors = PALETTES[pattern.brand],
    paintCode =
      selected === '__empty__'
        ? '__empty__'
        : colors.some((c) => c.code === selected)
          ? selected
          : (counts[0]?.color.code ?? colors[0].code);
  const brand = BRANDS.find((b) => b.id === pattern.brand)!;
  const cell =
    Math.max(
      2,
      Math.min(
        (viewport.width - 44) / (pattern.width + 1),
        (viewport.height - 24) / (pattern.height + 1),
      ),
    ) * zoom;
  const size = {
    width: (pattern.width + 1) * cell + 2,
    height: (pattern.height + 1) * cell + 2,
  };
  useEffect(() => {
    const node = scrollArea.current!;
    const observer = new ResizeObserver(([entry]) =>
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (mode === 'original') return;
    const c = canvas.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = Math.ceil(size.width * ratio);
    c.height = Math.ceil(size.height * ratio);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawPattern(ctx, pattern, {
      cell,
      mode,
      coordinates: true,
      highlight: hover,
    });
  }, [pattern, mode, cell, size.width, size.height, hover]);
  const chooseTool = (value: EditTool) => {
    setTool(value);
    if (value !== 'pan') setMode('chart');
  };
  const editCanvas = (clientX: number, clientY: number) => {
    const rect = canvas.current!.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / cell) - 1,
      y = Math.floor((clientY - rect.top) / cell) - 1;
    if (x >= 0 && x < pattern.width && y >= 0 && y < pattern.height)
      studio.edit(y * pattern.width + x, tool, paintCode);
  };
  return (
    <section className="panel preview-panel" aria-labelledby="preview-title">
      <h2 id="preview-title" className="sr-only">图纸预览与编辑</h2>
      <div className="preview-topbar">
        <div className="segmented preview-tabs" aria-label="预览模式">
          {[
            { value: 'beads', name: '成品预览' },
            { value: 'chart', name: '施工图纸' },
            { value: 'original', name: '原图' },
          ].map((v) => (
            <button
              key={v.value}
              className={mode === v.value ? 'selected' : ''}
              aria-pressed={mode === v.value}
              onClick={() => {
                setMode(v.value as ViewMode);
                setTool('pan');
              }}
            >
              {v.name}
            </button>
          ))}
        </div>
        <div className="zoom-tools">
          <button
            title="缩小"
            aria-label="缩小图纸"
            disabled={zoom <= 0.5}
            onClick={() => setZoom((v) => Math.max(0.5, v - 0.25))}
          >
            <ZoomOut size={16} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            title="放大"
            aria-label="放大图纸"
            disabled={zoom >= 4}
            onClick={() => setZoom((v) => Math.min(4, v + 0.25))}
          >
            <ZoomIn size={16} />
          </button>
          <button
            className="fit-button"
            title="适应窗口"
            aria-label="适应窗口"
            onClick={() => {
              setZoom(1);
              scrollArea.current?.scrollTo(0, 0);
            }}
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
      <div className={`canvas-status ${studio.dirty ? 'pending' : ''}`} role="status">
        {studio.dirty ? <AlertCircle size={15} /> : null}
        <span>{busy ? '正在生成新图纸，当前画布暂时保留' : studio.dirty ? `设置尚未应用 · 当前画布 ${pattern.width} × ${pattern.height} 格；下载仍为当前图纸` : `${brand.name} · 当前设置已应用`}</span>
        {studio.hasEdits ? <span className="manual-edit-note">含手动修改</span> : null}
      </div>
      <div
        ref={scrollArea}
        className={`canvas-viewport ${tool === 'pan' ? 'pan' : 'editing'}`}
        onPointerDown={(e) => {
          if (tool !== 'pan') return;
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            left: e.currentTarget.scrollLeft,
            top: e.currentTarget.scrollTop,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          e.currentTarget.scrollLeft =
            drag.current.left - (e.clientX - drag.current.x);
          e.currentTarget.scrollTop =
            drag.current.top - (e.clientY - drag.current.y);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div
          className="canvas-stage"
          style={
            mode === 'original'
              ? undefined
              : { minWidth: size.width + 24, minHeight: size.height + 24 }
          }
        >
          {mode === 'original' ? (
            <img
              className="original-image"
              src={selection.image.preview}
              alt="原图预览"
            />
          ) : (
            <canvas
              ref={canvas}
              style={{ width: size.width, height: size.height }}
              role="img"
              aria-label={`${pattern.width}乘${pattern.height}格${mode === 'chart' ? '施工图纸' : '拼豆成品预览'}，共${total}颗豆`}
              onClick={(e) => {
                if (!busy && tool !== 'pan') editCanvas(e.clientX, e.clientY);
              }}
            />
          )}
        </div>
        {busy ? (
          <div className="processing-overlay">
            <span className="spinner" />
            正在匹配实体豆色…
          </div>
        ) : null}
      </div>
      <div className="edit-toolbar">
        <div className="tool-group">
          {[
            { id: 'pan', icon: Hand, name: '拖动画布', label: '拖动' },
            { id: 'paint', icon: Paintbrush, name: '单格改色', label: '画笔' },
            { id: 'erase', icon: Eraser, name: '擦除豆子', label: '擦除' },
            { id: 'replace', icon: Replace, name: '整色替换', label: '整色替换' },
          ].map((t) => (
            <button
              key={t.id}
              aria-label={t.name}
              title={t.name}
              className={tool === t.id ? 'selected' : ''}
              aria-pressed={tool === t.id}
              disabled={busy}
              onClick={() => chooseTool(t.id as EditTool)}
            >
              <t.icon size={16} /><span>{t.label}</span>
            </button>
          ))}
          <span className="tool-separator" />
          <button
            title="撤销"
            aria-label="撤销"
            disabled={!studio.canUndo || busy}
            onClick={studio.undoEdit}
          >
            <Undo2 size={16} /><span>撤销</span>
          </button>
          <button
            title="重做"
            aria-label="重做"
            disabled={!studio.canRedo || busy}
            onClick={studio.redoEdit}
          >
            <Redo2 size={16} /><span>重做</span>
          </button>
        </div>
        {tool === 'pan' ? (
          <span className="tool-hint">
            <MousePointer2 size={12} />
            拖动画布
          </span>
        ) : (
          <label className="paint-select">
            <span className="tool-name">
              {{ paint: '单格改色', erase: '擦除豆子', replace: '整色替换' }[tool]}
            </span>
            <span
              className="paint-dot"
              style={{
                background:
                  paintCode === '__empty__'
                    ? 'repeating-conic-gradient(#ddd 0% 25%,#fff 0% 50%) 0/6px 6px'
                    : cssColor(colors.find((c) => c.code === paintCode)!),
              }}
            />
            <select
              aria-label="绘制色号"
              value={paintCode}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="__empty__">留空（不放豆）</option>
              {colors.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="pattern-footer">
        <div className="pattern-stats">
          <span>
            <strong>
              {pattern.width} × {pattern.height}
            </strong>{' '}
            格
          </span>
          <i />
          <span>
            <strong>{total.toLocaleString()}</strong> 颗
          </span>
          <i />
          <span>
            <strong>{counts.length}</strong> 种颜色
          </span>
          <span className="dimensions">
            约 {(pattern.width * 0.5).toFixed(1)} ×{' '}
            {(pattern.height * 0.5).toFixed(1)} cm
          </span>
        </div>
        <div className="used-colors">
          {counts.slice(0, 6).map((v) => (
            <button
              className="used-color"
              title={`${v.label} · ${v.color.code} ${v.color.name} · ${v.count}颗（点击选择画笔颜色）`}
              aria-label={`选择画笔 ${v.color.code}`}
              key={v.color.code}
              onMouseEnter={() => setHover(v.color.code)}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                setSelected(v.color.code);
                chooseTool('paint');
              }}
            >
              <span
                className="bead-swatch"
                style={{ background: cssColor(v.color) }}
              />
              <small>{v.count}</small>
            </button>
          ))}
          {counts.length > 6 ? (
            <button
              className="more-colors"
              title="查看全部用豆清单"
              onClick={() => setShowList((v) => !v)}
            >
              +{counts.length - 6}
            </button>
          ) : null}
          {counts.length === 0 ? (
            <span className="field-hint">当前图纸为空，可用画笔添加豆子</span>
          ) : null}
        </div>
        <button className="button counts-button" onClick={() => setShowList(true)} aria-haspopup="dialog">
          <ListChecks size={16} />用豆清单
        </button>
      </div>
      {showList ? (
        <Modal title="用豆清单" onClose={() => setShowList(false)} drawer>
          <p className="modal-subtitle">
            {pattern.name} · {pattern.width} × {pattern.height} 格 · 约 {(pattern.width * 0.5).toFixed(1)} × {(pattern.height * 0.5).toFixed(1)} cm
            <br />{counts.length} 种颜色 · 共 {total.toLocaleString()} 颗
          </p>
          <div className="counts-table">
            <table>
              <thead>
                <tr>
                  <th>标记</th>
                  <th>实体色号 / 名称</th>
                  <th>用量</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((v) => (
                  <tr key={v.color.code}>
                    <td>
                      <span
                        className="table-swatch"
                        style={{ background: cssColor(v.color) }}
                      />
                      {v.label}
                    </td>
                    <td>
                      <strong>{v.color.code}</strong>
                      <small>{v.color.name}</small>
                    </td>
                    <td>{v.count} 颗</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>合计</td>
                  <td>{total} 颗</td>
                </tr>
              </tfoot>
            </table>
            <p>
              屏幕配色为近似参考，请以实体色卡为准。尺寸按 5mm
              格距估算，熨烫后可能变化。
            </p>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
