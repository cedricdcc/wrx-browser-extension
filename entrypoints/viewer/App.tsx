import { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { generateShaclShapes } from './agent';

// Custom Hooks
import { useWRXSession } from './hooks/useWRXSession';
import { useAIAgent } from './hooks/useAIAgent';
import { usePhysicsLayout } from './hooks/usePhysicsLayout';

// UI and Layout Components
import { Header } from './components/layout/Header';
import { Tabs, TabId } from './components/layout/Tabs';
import { ErrorToast } from './components/ui/ErrorToast';
import { StatCard } from './components/ui/StatCard';

// Feature Tab Components
import { NavigationTab } from './components/feature/navigation/NavigationTab';
import { AgentTab } from './components/feature/agent/AgentTab';
import { TriplesTab } from './components/feature/triples/TriplesTab';
import { AnalyticsTab } from './components/feature/analytics/AnalyticsTab';
import { SourceTab } from './components/feature/source/SourceTab';
import { DiscoveryTraceTab } from './components/feature/trace/DiscoveryTraceTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('graph');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  
  const [graphViewMode, setGraphViewMode] = useState<'spring' | 'treeList'>(() => {
    return (sessionStorage.getItem('wrx_session_graph_mode') as any) || 'spring';
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    document.body.className = `${theme}-theme`;
  }, [theme]);

  // Hook 1: Session state and WRX triple crawler
  const {
    triples,
    visitedNodes,
    navigationEdges,
    traces,
    selectedUri,
    targetInput,
    error,
    loading,
    downloading,
    triplesRef,
    visitedNodesRef,
    navigationEdgesRef,
    setTargetInput,
    setError,
    handleSearchSubmit,
    handleNodeClick,
    handleNodeSelect,
    handleDownloadTurtle,
    handleResetSession,
    fetchSemanticData
  } = useWRXSession();

  // Hook 2: Autonomous AI Explorative reasoning loops
  const {
    agentEndpoint,
    setAgentEndpoint,
    agentApiKey,
    setAgentApiKey,
    agentModel,
    setAgentModel,
    agentFormat,
    setAgentFormat,
    agentMaxCalls,
    setAgentMaxCalls,
    agentQuestion,
    setAgentQuestion,
    isAgentRunning,
    agentLogs,
    agentAnswer,
    agentStatusText,
    agentCurrentCalls,
    showAgentSettings,
    setShowAgentSettings,
    handleStartAgent,
    handleStopAgent
  } = useAIAgent({
    selectedUri,
    visitedNodes,
    triplesRef,
    visitedNodesRef,
    navigationEdgesRef,
    fetchSemanticData,
    setError
  });

  // Hook 3: Force-directed Spring SVG physics layout
  const {
    graphNodes,
    handleSVGMouseDown,
    handleSVGMouseMove,
    handleSVGMouseUpOrLeave
  } = usePhysicsLayout({
    visitedNodes,
    navigationEdges,
    triplesRef,
    activeTab,
    graphViewMode
  });

  const activeTrace = traces[selectedUri];
  const shaclShapesText = useMemo(() => generateShaclShapes(triples), [triples]);

  return (
    <div className="dashboard-container">
      {/* Glow Effects */}
      <div className="glow-effect cyan"></div>
      <div className="glow-effect purple"></div>

      {/* Main App Header */}
      <Header
        targetInput={targetInput}
        setTargetInput={setTargetInput}
        onSubmit={handleSearchSubmit}
        onExport={handleDownloadTurtle}
        onReset={handleResetSession}
        theme={theme}
        onToggleTheme={toggleTheme}
        loading={loading}
        downloading={downloading}
        isExportDisabled={triples.length === 0}
        isResetDisabled={triples.length === 0}
      />

      {/* Stats Dashboard Info-Bar */}
      <section className="stats-dashboard">
        <StatCard
          title="Currently Selected Node"
          value={
            <span className="stat-value text-glow-cyan truncate-text" title={selectedUri}>
              {selectedUri.replace('https://', '').replace('http://', '') || 'None'}
            </span>
          }
        />
        <StatCard
          title="Node Format"
          value={<span className="stat-value text-glow-cyan">{activeTrace?.format || 'N/A'}</span>}
        />
        <StatCard
          title="Active Graph Size"
          value={
            <span className="stat-value text-glow-purple flex-center">
              {triples.length} quads
              {visitedNodes.length > 1 && (
                <span className="link-badge">{visitedNodes.length} nodes visited</span>
              )}
            </span>
          }
        />
        <StatCard
          title="Source Strategy"
          value={
            <span className={`stat-value badge ${activeTrace?.source || 'none'}`}>
              {activeTrace ? activeTrace.source : 'N/A'}
            </span>
          }
        />
      </section>

      {/* Main content grid */}
      <main className="dashboard-main">
        {/* Error notification banner */}
        {error && <ErrorToast error={error} onClose={() => setError('')} />}

        {/* Navigation Tabs bar switcher */}
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          isSourceDisabled={!activeTrace}
        />

        {/* Current active view panel rendering */}
        <div className="panel-container">
          {loading && (
            <div className="status-panel loading">
              <Loader2 className="spinner large" size={48} />
              <p>Cascading Web Resource Extraction In Progress...</p>
            </div>
          )}

          {!loading && (
            <>
              {activeTab === 'graph' && (
                <NavigationTab
                  graphNodes={graphNodes}
                  navigationEdges={navigationEdges}
                  triples={triples}
                  visitedNodes={visitedNodes}
                  selectedUri={selectedUri}
                  onSelectNode={handleNodeSelect}
                  onMouseDown={handleSVGMouseDown}
                  onMouseMove={handleSVGMouseMove}
                  onMouseUp={handleSVGMouseUpOrLeave}
                  graphViewMode={graphViewMode}
                  setGraphViewMode={setGraphViewMode}
                />
              )}

              {activeTab === 'agent' && (
                <AgentTab
                  agentEndpoint={agentEndpoint}
                  setAgentEndpoint={setAgentEndpoint}
                  agentApiKey={agentApiKey}
                  setAgentApiKey={setAgentApiKey}
                  agentModel={agentModel}
                  setAgentModel={setAgentModel}
                  agentFormat={agentFormat}
                  setAgentFormat={setAgentFormat}
                  agentMaxCalls={agentMaxCalls}
                  setAgentMaxCalls={setAgentMaxCalls}
                  agentQuestion={agentQuestion}
                  setAgentQuestion={setAgentQuestion}
                  isAgentRunning={isAgentRunning}
                  agentLogs={agentLogs}
                  agentAnswer={agentAnswer}
                  agentStatusText={agentStatusText}
                  agentCurrentCalls={agentCurrentCalls}
                  showAgentSettings={showAgentSettings}
                  setShowAgentSettings={setShowAgentSettings}
                  handleStartAgent={handleStartAgent}
                  handleStopAgent={handleStopAgent}
                  shaclShapesText={shaclShapesText}
                />
              )}

              {activeTab === 'triples' && (
                <TriplesTab
                  triples={triples}
                  selectedUri={selectedUri}
                  onNodeClick={handleNodeClick}
                />
              )}

              {activeTab === 'analytics' && <AnalyticsTab triples={triples} />}

              {activeTab === 'source' && activeTrace && (
                <SourceTab activeTrace={activeTrace} />
              )}

              {activeTab === 'trace' && activeTrace && (
                <DiscoveryTraceTab
                  activeTrace={activeTrace}
                  selectedUri={selectedUri}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
