import { useState } from 'react';
import {
  Link2,
  Unlink2,
  Minus,
  Plus,
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react';
import { BRANDS, PALETTES, cssColor } from '../data/palettes';
import type { ActiveStudio } from '../lib/useStudio';

const SIZE_PRESETS = [
  { label: '简化', longest: 32 },
  { label: '平均', longest: 64 },
  { label: '细节', longest: 96 },
];
export function SettingsPanel({ studio, onGenerate }: { studio: ActiveStudio; onGenerate: () => void }) {
  const [locked, setLocked] = useState(true), [more, setMore] = useState(false);
  const { settings, setSettings, busy } = studio;
  const source = studio.current.selection.image;
  const setSize = (axis: 'width' | 'height', value: number) => {
    const v = Math.max(1, Math.min(200, Math.round(value) || 1));
    setSettings((s) => {
      const next = { ...s, [axis]: v };
      if (locked) {
        const ratio = source.width / source.height;
        if (axis === 'width')
          next.height = Math.max(1, Math.min(200, Math.round(v / ratio)));
        else next.width = Math.max(1, Math.min(200, Math.round(v * ratio)));
      }
      return next;
    });
  };
  const colors = PALETTES[settings.brand];
  return (
    <section className="panel settings-panel" aria-labelledby="settings-title">
      <div className="section-title">
        <h2 id="settings-title">图纸设置</h2>
      </div>
      <div className="source-summary">
        <img src={source.preview} alt="来源图片" />
        <div><strong title={source.name}>{source.name}</strong><span>{source.width} × {source.height} px</span></div>
      </div>
      <fieldset className="settings-scroll" disabled={busy} aria-label="图纸设置参数">
        <fieldset className="field-group">
          <legend>
            拼豆品牌 <span>已收录基础实色</span>
          </legend>
          <div className="brand-options">
            {BRANDS.map((brand) => (
              <button
                key={brand.id}
                title={`${brand.name} · ${brand.series}`}
                className={`brand-option ${settings.brand === brand.id ? 'selected' : ''}`}
                aria-pressed={settings.brand === brand.id}
                onClick={() => setSettings((s) => ({ ...s, brand: brand.id, excluded: [] }))}
              >
                <span className="mini-bead" style={{ background: brand.tone }} />
                <span>
                  <strong>{brand.name}</strong>
                  <small>{brand.series}</small>
                </span>
                {settings.brand === brand.id ? <Check className="brand-check" size={11} /> : null}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="field-group">
          <div className="field-heading">
            <label htmlFor="grid-width">
              网格尺寸 <span>（格数）</span>
            </label>
            <button
              className="text-button"
              onClick={() => {
                const scale = Math.min(
                  1,
                  200 / Math.max(source.width, source.height),
                );
                setSettings((s) => ({
                  ...s,
                  width: Math.max(1, Math.round(source.width * scale)),
                  height: Math.max(1, Math.round(source.height * scale)),
                }));
              }}
            >
              <RotateCcw size={12} />
              原始尺寸
            </button>
          </div>
          <div className="segmented size-presets" role="group" aria-label="网格尺寸预设">
            {SIZE_PRESETS.map((preset) => {
              const scale = preset.longest / Math.max(source.width, source.height);
              const width = Math.max(1, Math.round(source.width * scale));
              const height = Math.max(1, Math.round(source.height * scale));
              const selected = settings.width === width && settings.height === height;
              return (
                <button
                  key={preset.label}
                  className={selected ? 'selected' : ''}
                  aria-pressed={selected}
                  title={`最长边 ${preset.longest} 格，保持原图比例`}
                  onClick={() => {
                    setLocked(true);
                    setSettings((s) => ({ ...s, width, height }));
                  }}
                >
                  <span>{preset.label}</span>
                  <small>{preset.longest} 格</small>
                </button>
              );
            })}
          </div>
          <div className="size-row">
            {(['width', 'height'] as const).map((axis, i) => (
              <div className="size-part" key={axis}>
                {i === 1 ? (
                  <button
                    className={`lock-button ${locked ? 'locked' : ''}`}
                    aria-label={locked ? '解锁宽高比例' : '锁定宽高比例'}
                    aria-pressed={locked}
                    onClick={() => setLocked((v) => !v)}
                  >
                    {locked ? <Link2 size={15} /> : <Unlink2 size={15} />}
                  </button>
                ) : null}
                <label htmlFor={`grid-${axis}`}>
                  {axis === 'width' ? '宽' : '高'}
                </label>
                <div className="number-control">
                  <button
                    aria-label={axis === 'width' ? '减少宽度' : '减少高度'}
                    onClick={() => setSize(axis, settings[axis] - 1)}
                    disabled={settings[axis] <= 1}
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    id={`grid-${axis}`}
                    type="number"
                    min={1}
                    max={200}
                    value={settings[axis]}
                    onChange={(e) => setSize(axis, Number(e.target.value))}
                  />
                  <button
                    aria-label={axis === 'width' ? '增加宽度' : '增加高度'}
                    onClick={() => setSize(axis, settings[axis] + 1)}
                    disabled={settings[axis] >= 200}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <span className="field-hint">一格一颗豆 · 最长边 200 格</span>
        </div>
        <fieldset className="field-group">
          <legend>颜色数量</legend>
          <div className="segmented color-limits">
            {[
              { value: 0, label: '自动' },
              { value: 16, label: '最多 16 色' },
              { value: 24, label: '最多 24 色' },
            ].map((item) => (
              <button
                key={item.value}
                className={settings.limit === item.value ? 'selected' : ''}
                aria-pressed={settings.limit === item.value}
                onClick={() => setSettings((s) => ({ ...s, limit: item.value }))}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="advanced">
          <button
            className="advanced-toggle"
            onClick={() => setMore((v) => !v)}
            aria-expanded={more}
          >
            <span>
              <SlidersHorizontal size={15} />
              更多设置
            </span>
            <ChevronDown size={16} className={more ? 'rotate' : ''} />
          </button>
          {more ? (
            <div className="advanced-content">
              <label className="advanced-label">
                透明背景
                <select
                  value={settings.background}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      background: e.target.value as 'transparent' | 'white',
                    }))
                  }
                >
                  <option value="transparent">空白处不放豆</option>
                  <option value="white">叠加白色背景</option>
                </select>
              </label>
              {settings.background === 'transparent' ? (
                <label className="range-label">
                  透明度阈值 <span>{settings.alphaThreshold}</span>
                  <input
                    type="range"
                    min={0}
                    max={254}
                    value={settings.alphaThreshold}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        alphaThreshold: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              ) : null}
              <div className="palette-heading">
                可用颜色{' '}
                <span>
                  {colors.length - settings.excluded.length} / {colors.length}
                </span>
              </div>
              <div className="exclude-palette">
                {colors.map((c) => (
                  <button
                    key={c.code}
                    className={
                      settings.excluded.includes(c.code) ? 'excluded' : ''
                    }
                    style={{ background: cssColor(c) }}
                    title={`${c.code} ${c.name}${settings.excluded.includes(c.code) ? '（已排除）' : ''}`}
                    aria-label={`${settings.excluded.includes(c.code) ? '启用' : '排除'} ${c.code}`}
                    aria-pressed={!settings.excluded.includes(c.code)}
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        excluded: s.excluded.includes(c.code)
                          ? s.excluded.filter((code) => code !== c.code)
                          : [...s.excluded, c.code],
                      }))
                    }
                  >
                    {settings.excluded.includes(c.code) ? '×' : ''}
                  </button>
                ))}
              </div>
              <p className="field-hint">点击排除没有的颜色，再重新生成图纸。</p>
            </div>
          ) : null}
        </div>
      </fieldset>
      <div className="settings-actions">
        <button
          className="button primary generate-button"
          onClick={onGenerate}
          disabled={busy}
        >
          <Sparkles size={18} />
          {busy ? '正在匹配豆色…' : '更新图纸'}
        </button>
        <p className="local-note">
          <span />
          {studio.dirty
            ? '更新后应用新的尺寸与配色'
            : studio.hasEdits ? '当前图纸含手动修改' : '当前设置已应用'}
        </p>
      </div>
    </section>
  );
}
