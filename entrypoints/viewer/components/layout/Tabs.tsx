import { Network, Brain, BarChart2, FileCode, TerminalSquare } from 'lucide-react';

export type TabId = 'graph' | 'triples' | 'source' | 'analytics' | 'trace' | 'agent';

interface TabsProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  isSourceDisabled: boolean;
}

export const Tabs = ({ activeTab, onChange, isSourceDisabled }: TabsProps) => {
  return (
    <div className="tabs-bar">
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
    </div>
  );
};
