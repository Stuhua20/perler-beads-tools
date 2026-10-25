import { useEffect, useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { EXAMPLES, loadExample } from '../data/examples';
import type { ExampleId } from '../data/examples';
import type { PresetId } from '../data/presets';
import { PALETTES } from '../data/palettes';
import { generatePattern } from '../lib/process';
import { drawPattern } from '../lib/draw';
export function ExampleArt({ id }: { id: ExampleId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    canvas.width = 320;
    canvas.height = 320;
    const source = loadExample(id);
    const pattern = generatePattern(
      source,
      {
        brand: 'perler',
        width: 32,
        height: 32,
        limit: 0,
        excluded: [],
        alphaThreshold: 127,
        background: 'transparent',
      },
      PALETTES.perler,
    );
    const ctx = canvas.getContext('2d')!;
    drawPattern(ctx, pattern, { cell: 10, mode: 'beads' });
    /* Erase empty checkerboard to blend with the sample card. */ for (
      let i = 0;
      i < pattern.cells.length;
      i++
    )
      if (!pattern.cells[i])
        ctx.clearRect((i % 32) * 10, Math.floor(i / 32) * 10, 10, 10);
  }, [id]);
  return (
    <canvas
      ref={ref}
      aria-label={`${EXAMPLES.find((e) => e.id === id)!.title} 拼豆示例`}
    />
  );
}
export function Examples({ onSelect, selectedId, disabled = false }: {
  onSelect: (id: ExampleId) => void; selectedId?: PresetId | null; disabled?: boolean;
}) {
  return (
    <section
      className="examples-panel"
      id="examples"
      aria-labelledby="examples-title"
    >
      <div className="section-title">
        <div className="title-with-description">
          <h2 id="examples-title">也可以试试示例</h2>
        </div>
      </div>
      <div className="examples-grid">
        {EXAMPLES.map((example) => (
          <button
            className={`example-card ${example.tone} ${selectedId === example.id ? 'selected' : ''}`}
            disabled={disabled}
            aria-pressed={selectedId === example.id}
            key={example.id}
            onClick={() => onSelect(example.id)}
          >
            <div className="example-art">
              <ExampleArt id={example.id} />
            </div>
            <div className="example-description">
              <h3>{example.title}</h3>
              <p>{example.detail}</p>
              <span className="example-action" aria-hidden="true">
                {selectedId === example.id ? <Check size={17} /> : <ArrowRight size={17} />}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
