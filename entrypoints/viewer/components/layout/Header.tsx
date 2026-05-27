import { Search, Loader2, Zap, Download, ListRestart, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  targetInput: string;
  setTargetInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onExport: () => void;
  onReset: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  loading: boolean;
  isExportDisabled: boolean;
  isResetDisabled: boolean;
  downloading: boolean;
}

export const Header = ({
  targetInput,
  setTargetInput,
  onSubmit,
  onExport,
  onReset,
  theme,
  onToggleTheme,
  loading,
  isExportDisabled,
  isResetDisabled,
  downloading
}: HeaderProps) => {
  return (
    <header className="main-header">
      <div className="logo-container-group">
        <div className="logo-container">
          <span className="logo-text">
            WRX<span className="accent-dot">.</span>
          </span>
          <span className="logo-subtitle">Triple Viewer</span>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
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
        </div>
      </form>

      <div className="header-actions-group">
        <button
          type="button"
          className="download-btn"
          disabled={isExportDisabled || downloading}
          onClick={onExport}
          title="Export accumulated Knowledge Graph as .ttl file"
        >
          {downloading ? <Loader2 className="spinner" size={16} /> : <Download size={16} />}
          Export Graph
        </button>

        <button
          type="button"
          className="reset-btn"
          disabled={isResetDisabled}
          onClick={onReset}
          title="Reset current exploration session"
        >
          <ListRestart size={16} />
          Reset Session
        </button>
      </div>
    </header>
  );
};
