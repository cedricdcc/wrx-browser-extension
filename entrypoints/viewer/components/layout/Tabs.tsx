import { Network, Brain, BarChart2, FileCode, TerminalSquare, Compass, Settings, Info } from 'lucide-react';

export type ExploreTabId = 'graph' | 'triples' | 'source' | 'analytics' | 'trace' | 'agent' | 'about' | 'settings';
export type AutocrawlTabId = 'autocrawl-console' | 'autocrawl-graph' | 'autocrawl-importance' | 'autocrawl-report';
export type TabId = ExploreTabId | AutocrawlTabId;

interface TabsProps {
  segmentMode: 'explore' | 'autocrawl';
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  isSourceDisabled: boolean;
}

export const Tabs = ({
  segmentMode,
  activeTab,
  onChange,
  isSourceDisabled
}: TabsProps) => {
  if (segmentMode === 'explore') {
    return (
      <div className="tabs-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => onChange('graph')}
        >
          <Network size={16} />
          Navigation Tree
        </button>
        <button
          className={`tab-btn ${activeTab === 'agent' ? 'active' : ''}`}
          onClick={() => onChange('agent')}
        >
          <Brain size={16} />
          AI Search Agent
        </button>
        <button
          className={`tab-btn ${activeTab === 'triples' ? 'active' : ''}`}
          onClick={() => onChange('triples')}
        >
          <Network size={16} />
          Focused Triples
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => onChange('analytics')}
        >
          <BarChart2 size={16} />
          Analytics Graph
        </button>
        <button
          className={`tab-btn ${activeTab === 'source' ? 'active' : ''}`}
          onClick={() => onChange('source')}
          disabled={isSourceDisabled}
        >
          <FileCode size={16} />
          Raw RDF Source
        </button>
        <button
          className={`tab-btn ${activeTab === 'trace' ? 'active' : ''}`}
          onClick={() => onChange('trace')}
          disabled={isSourceDisabled}
        >
          <TerminalSquare size={16} />
          Discovery Trace
        </button>
        <button
          className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => onChange('about')}
        >
          <Info size={16} style={{ color: 'var(--accent-cyan)' }} />
          About STITCH
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onChange('settings')}
        >
          <Settings size={16} />
          Session Settings
        </button>
      </div>
    );
  }

  // Segment Mode: Autocrawl bottom tabs
  return (
    <div className="tabs-bar">
      <button
        className={`tab-btn ${activeTab === 'autocrawl-console' ? 'active' : ''}`}
        onClick={() => onChange('autocrawl-console')}
      >
        <Settings size={16} />
        Console & Settings
      </button>
      <button
        className={`tab-btn ${activeTab === 'autocrawl-graph' ? 'active' : ''}`}
        onClick={() => onChange('autocrawl-graph')}
      >
        <Compass size={16} />
        Directed Graph
      </button>
      <button
        className={`tab-btn ${activeTab === 'autocrawl-importance' ? 'active' : ''}`}
        onClick={() => onChange('autocrawl-importance')}
      >
        <Network size={16} />
        Centrality Table
      </button>
      <button
        className={`tab-btn ${activeTab === 'autocrawl-report' ? 'active' : ''}`}
        onClick={() => onChange('autocrawl-report')}
      >
        <Compass size={16} />
        Semantic Report & Charts
      </button>
    </div>
  );
};
