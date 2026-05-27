import { useState, useMemo, useEffect } from 'react';
import { Loader2, Download, ListRestart, Settings as SettingsIcon } from 'lucide-react';
import { generateShaclShapes } from './agent';

// Custom Hooks
import { useWRXSession } from './hooks/useWRXSession';
import { useAIAgent } from './hooks/useAIAgent';
import { usePhysicsLayout } from './hooks/usePhysicsLayout';
import { useAutocrawl } from './hooks/useAutocrawl';

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
import { AutocrawlTab } from './components/feature/autocrawl/AutocrawlTab';
import { AutocrawlNetworkGraph } from './components/feature/autocrawl/AutocrawlNetworkGraph';
import { ImportanceTable } from './components/feature/autocrawl/ImportanceTable';
import { AutocrawlReport } from './components/feature/autocrawl/AutocrawlReport';
import { AboutTab } from './components/feature/about/AboutTab';

export default function App() {
  const [segmentMode, setSegmentMode] = useState<'explore' | 'autocrawl'>('explore');
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

  // Sync active bottom tab when top segment mode changes
  useEffect(() => {
    if (segmentMode === 'explore') {
      setActiveTab('graph');
    } else {
      setActiveTab('autocrawl-console');
    }
  }, [segmentMode]);

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
    fetchSemanticData,
    setTriples,
    setVisitedNodes,
    setNavigationEdges
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

  // Hook 4: BFS web HTML crawler & PageRank network analysis
  const {
    currentPhase,
    crawlLog,
    nodes,
    edges,
    progress,
    crawlDelay,
    setCrawlDelay,
    keywordCloud,
    useTabRendering,
    setUseTabRendering,
    maxDepth,
    setMaxDepth,
    runHtmlCrawl,
    runTripleHarvest,
    resetAutocrawl
  } = useAutocrawl(
    triples,
    setTriples,
    setVisitedNodes,
    setNavigationEdges
  );

  const activeTrace = traces[selectedUri];
  const shaclShapesText = useMemo(() => generateShaclShapes(triples), [triples]);

  return (
    <div className="dashboard-container">
      {/* Glow Effects */}
      <div className="glow-effect cyan"></div>
      <div className="glow-effect purple"></div>

      {/* Main App Header with Segment Toggle */}
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
        segmentMode={segmentMode}
        setSegmentMode={setSegmentMode}
        onAboutClick={() => {
          setSegmentMode('explore');
          setActiveTab('about');
        }}
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
          segmentMode={segmentMode}
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
              {/* EXPLORE MODE VIEWS */}
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

              {activeTab === 'about' && (
                <AboutTab />
              )}

              {activeTab === 'settings' && (
                <div className="tab-panel flex-col" style={{ gap: '1.5rem', maxWidth: '420px', margin: '2rem auto 0', padding: '0 1rem' }}>
                  <div className="glass-card flex-col" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '1.25rem', background: 'rgba(255,255,255,0.015)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                      <SettingsIcon className="text-glow-cyan" size={16} style={{ color: 'var(--accent-cyan)' }} />
                      STITCH Exploration Actions
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                      Manage your active STITCH knowledge graph session. Export accumulated quads or reset the exploration path entirely.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="download-btn"
                        disabled={triples.length === 0 || downloading}
                        onClick={handleDownloadTurtle}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          fontSize: '13px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: '8px',
                          fontWeight: 'bold',
                          cursor: triples.length === 0 || downloading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {downloading ? <Loader2 className="spinner" size={16} /> : <Download size={16} />}
                        Export Knowledge Graph (.ttl)
                      </button>

                      <button
                        type="button"
                        className="reset-btn"
                        disabled={triples.length === 0}
                        onClick={handleResetSession}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          fontSize: '13px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: '8px',
                          fontWeight: 'bold',
                          cursor: triples.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <ListRestart size={16} />
                        Reset Active Session
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AUTOCRAWL MODE VIEWS */}
              {activeTab === 'autocrawl-console' && (
                <AutocrawlTab
                  currentPhase={currentPhase}
                  crawlLog={crawlLog}
                  progress={progress}
                  crawlDelay={crawlDelay}
                  setCrawlDelay={setCrawlDelay}
                  useTabRendering={useTabRendering}
                  setUseTabRendering={setUseTabRendering}
                  maxDepth={maxDepth}
                  setMaxDepth={setMaxDepth}
                  runHtmlCrawl={runHtmlCrawl}
                  runTripleHarvest={runTripleHarvest}
                  resetAutocrawl={resetAutocrawl}
                  selectedUri={selectedUri}
                />
              )}

              {activeTab === 'autocrawl-graph' && (
                <div className="tab-panel flex-col">
                  <div className="trace-intro">
                    <h3>Hyperlink & Semantic Crawler Network</h3>
                    <p>Visual representation of crawled HTML nodes (cyan) and secondary semantic RDF relations (purple) sized by PageRank centrality scores.</p>
                  </div>
                  <AutocrawlNetworkGraph nodes={nodes} edges={edges} />
                </div>
              )}

              {activeTab === 'autocrawl-importance' && (
                <div className="tab-panel flex-col">
                  <div className="trace-intro">
                    <h3>PageRank Centrality Ranks</h3>
                    <p>Ranked metrics of document importance inside the local network neighbourhood.</p>
                  </div>
                  <ImportanceTable nodes={nodes} />
                </div>
              )}

              {activeTab === 'autocrawl-report' && (
                <AutocrawlReport
                  nodes={nodes}
                  edges={edges}
                  keywordCloud={keywordCloud}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
