import { Search, Loader2, Zap, Sun, Moon, Github, Info } from 'lucide-react';
import { StitchLogo } from '../ui/StitchLogo';

interface HeaderProps {
  targetInput: string;
  setTargetInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  loading: boolean;
  segmentMode: 'explore' | 'autocrawl';
  setSegmentMode: (val: 'explore' | 'autocrawl') => void;
  onAboutClick: () => void;
}

export const Header = ({
  targetInput,
  setTargetInput,
  onSubmit,
  theme,
  onToggleTheme,
  loading,
  segmentMode,
  setSegmentMode,
  onAboutClick
}: HeaderProps) => {
  return (
    <header className="main-header">
      <div className="logo-container-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StitchLogo size={28} style={{ filter: 'drop-shadow(0 2px 6px rgba(6, 182, 212, 0.15))' }} />
          <span className="logo-text" style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.06em' }}>
            STITCH
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={onAboutClick}
            className="theme-toggle-btn"
            title="About STITCH Framework"
            style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <Info size={17} />
          </button>

          <a
            href="https://github.com/cedricdcc/wrx-browser-extension"
            target="_blank"
            rel="noopener noreferrer"
            title="View STITCH GitHub Repo"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: 'var(--text-secondary)',
              padding: '6px',
              borderRadius: '6px',
              transition: 'opacity 0.2s'
            }}
            className="github-header-link"
          >
            <Github size={17} />
          </a>
        </div>
      </div>

      <form className="address-bar-form" onSubmit={onSubmit}>
        <div className="input-glow-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="address-input"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="Enter Semantic Web URI (e.g. example.org)"
          />
          <button type="submit" className="explore-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={16} /> : <Zap size={16} />}
            Explore
          </button>

          {/* Segmented Mode Toggles */}
          <div className="segmented-mode-selector" style={{ display: 'flex', background: 'var(--panel-background)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)', marginLeft: '12px' }}>
            <button
              type="button"
              className={`segment-toggle-btn ${segmentMode === 'explore' ? 'active' : ''}`}
              onClick={() => setSegmentMode('explore')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                background: segmentMode === 'explore' ? 'var(--accent-purple)' : 'transparent',
                color: segmentMode === 'explore' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Explore
            </button>
            <button
              type="button"
              className={`segment-toggle-btn ${segmentMode === 'autocrawl' ? 'active' : ''}`}
              onClick={() => setSegmentMode('autocrawl')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                background: segmentMode === 'autocrawl' ? 'var(--accent-cyan)' : 'transparent',
                color: segmentMode === 'autocrawl' ? '#000000' : 'var(--text-secondary)',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Autocrawl
            </button>
          </div>
        </div>
      </form>
    </header>
  );
};
