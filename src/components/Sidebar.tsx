import { Grid2X2, Images, CircleHelp, Palette, ArrowUpRight } from 'lucide-react';
export function Sidebar({
  onPalette,
  onGuide,
  onWorkspace,
  onWorkshop,
  activeView,
  disabled,
}: {
  onPalette: () => void;
  onGuide: () => void;
  onWorkspace: () => void;
  onWorkshop: () => void;
  activeView: 'workspace' | 'workshop';
  disabled: boolean;
}) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#workspace" aria-label="豆豆工坊首页" aria-disabled={disabled}
        onClick={(event) => { event.preventDefault(); if (!disabled) onWorkspace(); }}>
        <span className="brand-symbol">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>
          <strong>豆豆工坊</strong>
          <small>BEAD STUDIO</small>
        </span>
      </a>
      <nav aria-label="主导航">
        <a className={`nav-link ${activeView === 'workspace' ? 'active' : ''}`} href="#workspace" aria-disabled={disabled}
          aria-current={activeView === 'workspace' ? 'page' : undefined}
          onClick={(event) => { event.preventDefault(); if (!disabled) onWorkspace(); }}>
          <Grid2X2 />
          图纸工作台
          {activeView === 'workspace' ? <span className="nav-dot" /> : null}
        </a>
        <button className={`nav-link ${activeView === 'workshop' ? 'active' : ''}`}
          onClick={onWorkshop} disabled={disabled} aria-current={activeView === 'workshop' ? 'page' : undefined}>
          <Images />
          创意工坊
          {activeView === 'workshop' ? <span className="nav-dot" /> : null}
        </button>
        <button className="nav-link" onClick={onPalette}>
          <Palette />
          色卡参考
          <ArrowUpRight className="nav-arrow" />
        </button>
        <button className="nav-link" onClick={onGuide}>
          <CircleHelp />
          使用帮助
          <ArrowUpRight className="nav-arrow" />
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="craft-note">
          <span className="tiny-spark">✧</span>
          <p>
            小小的豆子，
            <br />
            也能拼出
            <br />
            大大的快乐。
          </p>
          <img src="/assets/bead-daisy.png" alt="用拼豆制成的雏菊与蝴蝶" />
          <span className="note-line" />
        </div>
        <div className="sidebar-caption">为每一份手作的心意</div>
      </div>
    </aside>
  );
}
