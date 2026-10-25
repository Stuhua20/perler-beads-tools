import { useRef, useState } from 'react';
import { ArrowRight, Check, ImagePlus, LockKeyhole, Upload } from 'lucide-react';
import type { Studio } from '../lib/useStudio';
import { Examples } from './Examples';

export function ImageStep({ studio, onNext }: { studio: Studio; onNext: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { candidate, busy, reading, current } = studio;
  const unavailable = busy || reading;
  return (
    <section className="image-step" aria-labelledby="choose-title">
      <header className="choose-heading">
        <h1 id="choose-title">选择一张喜欢的图片</h1>
        <p>上传自己的图片，或从示例开始。</p>
      </header>
      <div className="image-selection panel">
        <input
          ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden
          aria-label="选择本地图片" disabled={unavailable}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void studio.upload(file);
            e.target.value = '';
          }}
        />
        <div className={`image-dropzone ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); if (!unavailable) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragging(false);
            if (!unavailable && e.dataTransfer.files[0]) void studio.upload(e.dataTransfer.files[0]);
          }}
        >
          <Upload size={42} strokeWidth={1.4} />
          <h2>{reading ? '正在读取图片…' : dragging ? '松开，选择这张图片' : '拖拽图片到这里'}</h2>
          <p>PNG / JPG / WEBP · 最大 20MB</p>
          <button className="button" onClick={() => input.current?.click()} disabled={unavailable}>
            <ImagePlus size={17} />选择本地图片
          </button>
        </div>
        <div className="selected-source" aria-live="polite" aria-busy={reading}>
          <h2>{candidate ? <><Check size={17} />已选择</> : '原图预览'}</h2>
          {candidate ? (
            <>
              <div className="selected-source-image"><img src={candidate.image.preview} alt={`${candidate.image.name} 原图预览`} /></div>
              <div className="selected-source-details">
                <div><strong title={candidate.image.name}>{candidate.image.name}</strong>
                  <span>{candidate.image.width} × {candidate.image.height} px{candidate.exampleId ? ' · 示例图片' : ''}</span>
                </div>
                <button className="text-button" disabled={unavailable} onClick={() => input.current?.click()}>替换图片</button>
              </div>
            </>
          ) : (
            <div className="source-empty"><ImagePlus size={42} strokeWidth={1.2} /><p>选好图片后，在这里查看原图</p></div>
          )}
        </div>
      </div>
      <Examples onSelect={studio.useExample} selectedId={candidate?.exampleId} disabled={unavailable} />
      <div className="selection-actions">
        <div className="selection-note">
          <span><LockKeyhole size={14} />本地处理 · 图片不会上传服务器</span>
          {current ? <button className="text-button" onClick={studio.resumeEditor} disabled={unavailable}>继续编辑当前作品</button> : null}
        </div>
        <div className="next-action">
          <button className="button primary next-button" onClick={onNext} disabled={!candidate || unavailable}>
            {busy ? <><span className="spinner" />正在生成图纸…</> : <>下一步：调整图纸<ArrowRight size={19} /></>}
          </button>
          {studio.replacing ? <span>新图片尚未替换当前作品</span> : null}
        </div>
      </div>
    </section>
  );
}
