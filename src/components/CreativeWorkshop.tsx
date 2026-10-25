import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { PRESETS, presetPixels } from '../data/presets';
import type { PresetId } from '../data/presets';
import { PALETTES } from '../data/palettes';
import { generatePattern } from '../lib/process';
import { drawPattern } from '../lib/draw';
import type { Studio } from '../lib/useStudio';

function PresetArt({ id }: { id: PresetId }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const source = { ...presetPixels(id), preview: '' };
    const pattern = generatePattern(source, {
      brand: 'perler', width: source.width, height: source.height,
      limit: 0, excluded: [], alphaThreshold: 127, background: 'transparent',
    }, PALETTES.perler);
    const ctx = canvas.current!.getContext('2d')!;
    const cell = 12;
    drawPattern(ctx, pattern, { cell, mode: 'beads' });
    pattern.cells.forEach((color, index) => {
      if (!color) ctx.clearRect((index % pattern.width) * cell, Math.floor(index / pattern.width) * cell, cell, cell);
    });
  }, [id]);
  return <canvas ref={canvas} width={384} height={384} aria-hidden="true" />;
}

export function CreativeWorkshop({ studio, onOpen }: { studio: Studio; onOpen: (id: PresetId) => void }) {
  return (
    <section className="creative-workshop" aria-labelledby="workshop-title" aria-busy={studio.busy}>
      <header className="workshop-heading">
        <div>
          <h1 id="workshop-title">创意工坊</h1>
          <p>选一张喜欢的图片，直接开始调整与编辑。</p>
        </div>
        {studio.current ? (
          <button className="text-button workshop-resume" onClick={studio.resumeEditor} disabled={studio.busy}>
            继续编辑当前作品<ArrowRight size={16} />
          </button>
        ) : null}
      </header>
      <div className="preset-grid">
        {PRESETS.map((preset) => {
          const opening = studio.openingPreset === preset.id;
          return (
            <button className={`preset-card ${preset.tone} ${opening ? 'opening' : ''}`}
              key={preset.id} aria-label={`使用预设：${preset.title}`}
              disabled={studio.busy || studio.reading} onClick={() => onOpen(preset.id)}>
              <div className="preset-art">
                <PresetArt id={preset.id} />
                <span className="preset-open-hint">
                  {opening ? <><span className="spinner" />正在生成图纸…</> : <>使用这张图<ArrowRight size={15} /></>}
                </span>
              </div>
              <div className="preset-caption">
                <div><h2>{preset.title}</h2><span>推荐 {preset.width} × {preset.height} 格</span></div>
                <ArrowRight size={19} />
              </div>
            </button>
          );
        })}
      </div>
      <p className="workshop-note">点击图片后自动生成图纸，并进入调整与编辑。</p>
    </section>
  );
}
