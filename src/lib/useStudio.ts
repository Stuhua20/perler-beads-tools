import { useEffect, useReducer, useRef, useState } from 'react';
import { loadExample } from '../data/examples';
import type { ExampleId } from '../data/examples';
import { loadPreset } from '../data/presets';
import type { PresetId } from '../data/presets';
import { PALETTES } from '../data/palettes';
import { readImage } from './image';
import { emptyHistory, settingsPending, workReducer } from './studioState';
import type { ImageSelection } from './studioState';
import type { EditTool, Pattern, Settings } from './types';

const defaults: Settings = {
  brand: 'perler', width: 32, height: 32, limit: 0, excluded: [],
  alphaThreshold: 127, background: 'transparent',
};
interface Generation {
  id: number;
  selection: ImageSelection;
  config: Settings;
  replace: boolean;
  hadWork: boolean;
}

export function useStudio() {
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [view, setView] = useState<'workspace' | 'workshop'>('workspace');
  const [candidate, setCandidate] = useState<ImageSelection | null>(null);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [history, dispatch] = useReducer(workReducer, emptyHistory);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const worker = useRef<Worker | null>(null);
  const pending = useRef<Generation | null>(null);
  const request = useRef(0);
  const imageRequest = useRef(0);
  const current = history.current;

  useEffect(() => () => {
    worker.current?.terminate();
    worker.current = null;
    pending.current = null;
    imageRequest.current++;
  }, []);

  const failGeneration = (message: string) => {
    const hadWork = pending.current?.hadWork;
    pending.current = null;
    setBusy(false);
    setError(`${message}${hadWork ? '；原图纸和编辑记录已保留' : ''}`);
  };

  const ensureWorker = () => {
    if (worker.current) return worker.current;
    const w = new Worker(new URL('../workers/pattern.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    w.onmessage = (event: MessageEvent<{ id: number; pattern?: Pattern; error?: string }>) => {
      const job = pending.current;
      if (!job || event.data.id !== job.id) return;
      if (event.data.error || !event.data.pattern) {
        failGeneration(event.data.error || '未能生成图纸，请重试');
        return;
      }
      // Commit the image, applied settings and history only after success.
      dispatch({ type: 'generated', replace: job.replace, snapshot: {
        selection: job.selection, settings: job.config, pattern: event.data.pattern, edited: false,
      } });
      if (job.replace) setSettings(job.config);
      setCandidate(job.selection);
      pending.current = null;
      setBusy(false);
      setStep('edit');
      setView('workspace');
      setNotice('图纸已生成，可以开始编辑或下载');
    };
    w.onerror = (event) => {
      event.preventDefault();
      w.terminate();
      worker.current = null;
      failGeneration('图纸处理遇到问题，请重新生成');
    };
    w.onmessageerror = () => {
      w.terminate();
      worker.current = null;
      failGeneration('图纸结果读取失败，请重新生成');
    };
    return w;
  };

  const generate = (selection = current?.selection, config = settings, replace = false) => {
    if (!selection || pending.current) return;
    setError('');
    setNotice('');
    if (!PALETTES[config.brand].some((c) => !config.excluded.includes(c.code))) {
      setError('请至少保留一种可用颜色');
      return;
    }
    if (!Number.isInteger(config.width) || !Number.isInteger(config.height) ||
        config.width < 1 || config.width > 200 || config.height < 1 || config.height > 200) {
      setError('图纸宽高需为 1–200 格的整数');
      return;
    }
    const id = ++request.current;
    pending.current = {
      id, selection, config: { ...config, excluded: [...config.excluded] }, replace, hadWork: current !== null,
    };
    setBusy(true);
    try {
      ensureWorker().postMessage({ source: selection.image, settings: config, id });
    } catch {
      failGeneration('图纸处理未能启动，请重试');
    }
  };

  const openSelection = (selection: ImageSelection) => {
    if (reading || pending.current) return;
    if (selection === current?.selection) {
      setCandidate(selection);
      setStep('edit');
      setView('workspace');
      setError('');
      return;
    }
    const image = selection.image;
    const ratio = Math.min(1, 200 / Math.max(image.width, image.height));
    generate(selection, {
      ...settings,
      width: Math.max(1, Math.round(image.width * ratio)),
      height: Math.max(1, Math.round(image.height * ratio)),
    }, true);
  };

  const enterEditor = () => { if (candidate) openSelection(candidate); };
  const openPreset = (id: PresetId) => {
    if (reading || pending.current) return;
    openSelection(current?.selection.exampleId === id
      ? current.selection
      : { image: loadPreset(id), exampleId: id });
  };

  const useExample = (id: ExampleId) => {
    if (pending.current) return;
    imageRequest.current++;
    setReading(false);
    setError('');
    setCandidate(current?.selection.exampleId === id
      ? current.selection
      : { image: loadExample(id), exampleId: id });
  };

  const upload = async (file: File) => {
    if (pending.current) return;
    const id = ++imageRequest.current;
    setReading(true);
    setError('');
    try {
      const image = await readImage(file);
      if (id === imageRequest.current) setCandidate({ image, exampleId: null });
    } catch (e) {
      if (id === imageRequest.current) setError(e instanceof Error ? e.message : '图片读取失败');
    } finally {
      if (id === imageRequest.current) setReading(false);
    }
  };

  const edit = (index: number, tool: EditTool, code: string) => {
    if (!current || pending.current || tool === 'pan') return;
    const pattern = current.pattern;
    if (index < 0 || index >= pattern.cells.length) return;
    const old = pattern.cells[index];
    const value = tool === 'erase' || code === '__empty__' ? null : code;
    if (old === value) return;
    const cells = tool === 'replace'
      ? pattern.cells.map((c) => c === old ? value : c)
      : pattern.cells.map((c, i) => i === index ? value : c);
    dispatch({ type: 'edited', pattern: { ...pattern, cells } });
  };

  return {
    step, view, candidate, current, settings, setSettings, busy, reading, notice, setNotice, error, setError,
    openingPreset: busy && view === 'workshop' ? pending.current?.selection.exampleId ?? null : null,
    dirty: settingsPending(current, settings),
    hasEdits: current?.edited ?? false,
    replacing: current !== null && candidate !== null && candidate !== current.selection,
    generate: () => generate(), enterEditor, openPreset, useExample, upload, edit,
    showWorkshop: () => { if (!pending.current && !reading) { setView('workshop'); setError(''); setNotice(''); } },
    backToSelection: () => { if (!pending.current) { setStep('select'); setView('workspace'); setError(''); } },
    resumeEditor: () => {
      if (current && !pending.current && !reading) {
        setCandidate(current.selection);
        setStep('edit');
        setView('workspace');
        setError('');
      }
    },
    undoEdit: () => { if (!pending.current) dispatch({ type: 'undo' }); },
    redoEdit: () => { if (!pending.current) dispatch({ type: 'redo' }); },
    canUndo: history.undo.length > 0,
    canRedo: history.redo.length > 0,
  };
}
export type Studio = ReturnType<typeof useStudio>;
export type ActiveStudio = Studio & { current: NonNullable<Studio['current']> };
