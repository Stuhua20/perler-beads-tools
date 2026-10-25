import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Check, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ImageStep } from './components/ImageStep';
import { CreativeWorkshop } from './components/CreativeWorkshop';
import type { PresetId } from './data/presets';
import { Sidebar } from './components/Sidebar';
import { SettingsPanel } from './components/SettingsPanel';
import { PatternPanel } from './components/PatternPanel';
import { ExportDialog, PaletteDialog, GuideDialog, Modal } from './components/Dialogs';
import { useStudio } from './lib/useStudio';
import type { ActiveStudio, Studio } from './lib/useStudio';
import type { Pattern } from './lib/types';

function Steps({ studio }: { studio: Studio }) {
  const editing = studio.step === 'edit';
  return (
    <nav className="workflow-steps" aria-label="创作步骤">
      <button className={`workflow-step ${!editing ? 'active' : 'complete'}`}
        aria-current={!editing ? 'step' : undefined} disabled={studio.busy || studio.reading}
        onClick={studio.backToSelection}>
        <span>{editing ? <Check size={17} /> : '1'}</span>选择图片
      </button>
      <i aria-hidden="true" />
      <button className={`workflow-step ${editing ? 'active' : ''}`}
        aria-current={editing ? 'step' : undefined}
        disabled={!studio.current || studio.busy || studio.reading} onClick={studio.resumeEditor}>
        <span>2</span>调整与编辑
      </button>
    </nav>
  );
}

type Confirmation = { type: 'replace'; presetId?: PresetId } | { type: 'regenerate' };

export default function App() {
  const studio = useStudio();
  const [dialog, setDialog] = useState<'palette' | 'guide' | 'export' | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [exportSnapshot, setExportSnapshot] = useState<Pattern | null>(null);
  const [exportPending, setExportPending] = useState(false);
  const activeStudio: ActiveStudio | null = studio.current ? { ...studio, current: studio.current } : null;
  const editing = studio.step === 'edit';
  const workshop = studio.view === 'workshop';

  useEffect(() => {
    if (!studio.notice) return;
    const timer = setTimeout(() => studio.setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [studio.notice, studio.setNotice]);

  const next = () => {
    if (studio.replacing && studio.hasEdits) setConfirmation({ type: 'replace' });
    else studio.enterEditor();
  };
  const update = () => {
    if (studio.hasEdits) setConfirmation({ type: 'regenerate' });
    else studio.generate();
  };
  const openPreset = (id: PresetId) => {
    if (studio.hasEdits && studio.current?.selection.exampleId !== id) {
      setConfirmation({ type: 'replace', presetId: id });
    } else studio.openPreset(id);
  };
  const download = () => {
    if (!studio.current || studio.busy) return;
    setExportSnapshot(studio.current.pattern);
    setExportPending(studio.dirty);
    setDialog('export');
  };
  return (
    <div className="studio-app">
      <Sidebar
        onPalette={() => setDialog('palette')}
        onGuide={() => setDialog('guide')}
        onWorkspace={studio.current ? studio.resumeEditor : studio.backToSelection}
        onWorkshop={studio.showWorkshop}
        activeView={studio.view}
        disabled={studio.busy || studio.reading}
      />
      <main className={`workflow-main ${workshop ? 'is-workshop' : editing ? 'is-editing' : 'is-selecting'}`} id="workspace">
        {workshop ? <CreativeWorkshop studio={studio} onOpen={openPreset} /> : null}
        <div hidden={workshop}>
          <div className="workflow-navigation">
            <div className="workflow-back">
              {editing ? <button className="text-button" onClick={studio.backToSelection} disabled={studio.busy}>
                <ArrowLeft size={18} />返回选图
              </button> : null}
            </div>
            <Steps studio={studio} />
            <div className="workspace-download">
              {editing ? <>
                <button className="button primary" onClick={download} disabled={studio.busy}>
                  <Download size={17} />下载图纸
                </button>
                <span>{studio.busy ? '生成完成后可下载' : '导出当前画布'}</span>
              </> : null}
            </div>
          </div>
          <div hidden={editing}><ImageStep studio={studio} onNext={next} /></div>
          {activeStudio ? (
            <div className="editor-stage" hidden={!editing}>
              <SettingsPanel studio={activeStudio} onGenerate={update} />
              <PatternPanel studio={activeStudio} />
            </div>
          ) : null}
        </div>
      </main>
      {studio.error ? (
        <div className="toast error" role="alert"><AlertCircle size={17} />{studio.error}
          <button aria-label="关闭提示" onClick={() => studio.setError('')}><X size={15} /></button>
        </div>
      ) : studio.notice ? (
        <div className="toast" role="status"><CheckCircle2 size={17} />{studio.notice}</div>
      ) : null}
      {dialog === 'palette' ? <PaletteDialog initialBrand={studio.settings.brand} onClose={() => setDialog(null)} />
        : dialog === 'guide' ? <GuideDialog onClose={() => setDialog(null)} />
        : dialog === 'export' && exportSnapshot ? (
          <ExportDialog pattern={exportSnapshot} initialFormat="png" pendingSettings={exportPending}
            onClose={() => setDialog(null)} onSuccess={studio.setNotice} />
        ) : null}
      {confirmation ? (
        <Modal title={confirmation.type === 'replace' ? '替换当前作品？' : '重新生成图纸？'} onClose={() => setConfirmation(null)}>
          <p className="confirmation-copy">
            {confirmation.type === 'replace'
              ? '当前作品含手动修改。使用新图片生成成功后，将替换当前作品并开始新的编辑记录；生成失败会保留原作品。'
              : '重新生成将基于原图应用当前设置，并覆盖画布中的手动修改。生成成功后，可以通过“撤销”恢复更新前的图纸和修改。'}
          </p>
          <div className="confirmation-actions">
            <button className="button" onClick={() => setConfirmation(null)}>取消</button>
            <button className="button primary" onClick={() => {
              const action = confirmation;
              setConfirmation(null);
              if (action.type === 'replace') {
                if (action.presetId) studio.openPreset(action.presetId);
                else studio.enterEditor();
              } else studio.generate();
            }}>{confirmation.type === 'replace' ? '使用新图片' : '重新生成'}</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
