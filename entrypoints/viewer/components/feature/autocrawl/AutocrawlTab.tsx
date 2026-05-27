import { useState, useRef, useEffect } from 'react';
import { Network, Play, ListRestart, ArrowRight, Bot, Sparkles, Loader2 } from 'lucide-react';
import { AutocrawlPhase } from '../../../hooks/useAutocrawl';

interface AutocrawlTabProps {
  currentPhase: AutocrawlPhase;
  crawlLog: string[];
  progress: { current: number; total: number };
  crawlDelay: number;
  setCrawlDelay: (val: number) => void;
  useTabRendering: boolean;
  setUseTabRendering: (val: boolean) => void;
  maxDepth: number;
  setMaxDepth: (val: number) => void;
  runHtmlCrawl: (seedUrl: string) => Promise<void>;
  runTripleHarvest: () => Promise<void>;
  resetAutocrawl: () => void;
  selectedUri: string;
}

export const AutocrawlTab = ({
  currentPhase,
  crawlLog,
  progress,
  crawlDelay,
  setCrawlDelay,
  useTabRendering,
  setUseTabRendering,
  maxDepth,
  setMaxDepth,
  runHtmlCrawl,
  runTripleHarvest,
  resetAutocrawl,
  selectedUri
}: AutocrawlTabProps) => {
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [showSemanticModal, setShowSemanticModal] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef<AutocrawlPhase>('idle');

  // Auto-scroll terminal timeline container to the bottom when new logs cascade
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [crawlLog]);

  // Handle phase transition triggers for completion dialogs
  useEffect(() => {
    if (prevPhaseRef.current === 'html-crawling' && currentPhase === 'html-complete') {
      setShowHtmlModal(true);
    }
    if (prevPhaseRef.current === 'semantic-harvesting' && currentPhase === 'semantic-complete') {
      setShowSemanticModal(true);
    }
    prevPhaseRef.current = currentPhase;
  }, [currentPhase]);

  const handleStartCrawl = () => {
    if (!selectedUri) return;
    runHtmlCrawl(selectedUri);
  };

  const renderLogEntry = (logStr: string, index: number) => {
    let badgeColor = 'var(--text-secondary)';
    let badgeBg = 'rgba(255,255,255,0.06)';
    let textColor = '#e2e8f0'; 
    let badgeText = 'LOG';
    let message = logStr;

    const match = logStr.match(/^\[([A-Z0-9\s_]+)\]\s*(.*)$/);
    if (match) {
      badgeText = match[1];
      message = match[2];
      switch (badgeText) {
        case 'INFO':
          badgeColor = '#06b6d4';
          badgeBg = 'rgba(6, 182, 212, 0.15)';
          textColor = '#e2e8f0';
          break;
        case 'SETTINGS':
          badgeColor = '#c084fc';
          badgeBg = 'rgba(168, 85, 247, 0.15)';
          textColor = '#e2e8f0';
          break;
        case 'SPA':
        case 'SPA ERROR':
          badgeColor = '#facc15';
          badgeBg = 'rgba(250, 204, 21, 0.12)';
          textColor = '#fef08a';
          break;
        case 'CRAWL':
          badgeColor = '#60a5fa';
          badgeBg = 'rgba(96, 165, 250, 0.12)';
          textColor = '#e2e8f0';
          break;
        case 'SUCCESS':
          badgeColor = '#34d399';
          badgeBg = 'rgba(52, 211, 153, 0.12)';
          textColor = '#a7f3d0';
          break;
        case 'WARN':
        case 'RETRY':
          badgeColor = '#fb923c';
          badgeBg = 'rgba(251, 146, 60, 0.12)';
          textColor = '#fed7aa';
          break;
        case 'ERROR':
          badgeColor = '#f87171';
          badgeBg = 'rgba(248, 113, 113, 0.15)';
          textColor = '#fca5a5';
          break;
        case 'HARVEST':
          badgeColor = '#f472b6';
          badgeBg = 'rgba(244, 114, 182, 0.12)';
          textColor = '#fbcfe8';
          break;
      }
    }

    return (
      <div key={index} className="terminal-log-entry font-mono text-xs animate-fadeIn" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 4px', color: textColor, lineHeight: '1.4' }}>
        <span style={{ 
          display: 'inline-block', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          fontSize: '10px', 
          fontWeight: '700', 
          letterSpacing: '0.05em',
          backgroundColor: badgeBg, 
          color: badgeColor,
          border: `1px solid ${badgeColor}33`,
          minWidth: '82px',
          textAlign: 'center',
          flexShrink: 0
        }}>{badgeText}</span>
        <span style={{ wordBreak: 'break-all', opacity: 0.95 }}>{message}</span>
      </div>
    );
  };

  const isStep1Active = currentPhase !== 'idle';
  const isStep2Active = currentPhase === 'html-complete' || currentPhase === 'semantic-harvesting' || currentPhase === 'semantic-complete';
  const isStep3Active = currentPhase === 'semantic-complete';

  return (
    <div className="tab-panel flex-col agent-panel">
      {/* Intro Header */}
      <div className="agent-intro-container">
        <div className="agent-intro-header">
          <Network className="agent-bot-icon text-glow-cyan animate-pulse" size={32} />
          <div className="agent-intro-title">
            <h3>Autocrawl &amp; Centrality Console Settings</h3>
            <p>Configure queue rate-limit delays, supervise sequential BFS crawling timeline loops, and fire targeted WRX semantic extractions.</p>
          </div>
        </div>
      </div>

      {/* Progress Timelines */}
      <div className="autocrawl-progress-bar glass-card" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '1.25rem 1.5rem', 
        gap: '1.5rem', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.02)'
      }}>
        {/* Step 1 */}
        <div className={`progress-step-indicator ${isStep1Active ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px' }}>
          <div className="step-num" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: isStep1Active ? 'linear-gradient(135deg, var(--accent-cyan) 0%, #06b6d4 100%)' : 'var(--bg-tertiary)', 
            color: isStep1Active ? '#020617' : 'var(--text-secondary)', 
            fontWeight: 'bold',
            border: isStep1Active ? 'none' : '1px solid var(--border-color)',
            boxShadow: isStep1Active ? '0 0 12px rgba(6, 182, 212, 0.4)' : 'none',
            transition: 'all 0.3s ease'
          }}>1</div>
          <div className="step-desc" style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '13px', color: isStep1Active ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}>BFS Web Crawler</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Extract HTML links (Depth {maxDepth})</span>
          </div>
        </div>

        <ArrowRight size={16} className="timeline-arrow" style={{ color: isStep1Active ? 'var(--accent-cyan)' : 'var(--text-tertiary)', opacity: 0.6, flexShrink: 0 }} />

        {/* Step 2 */}
        <div className={`progress-step-indicator ${isStep2Active ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px' }}>
          <div className="step-num" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: isStep2Active ? 'linear-gradient(135deg, var(--accent-purple) 0%, #a855f7 100%)' : 'var(--bg-tertiary)', 
            color: isStep2Active ? '#fff' : 'var(--text-secondary)', 
            fontWeight: 'bold',
            border: isStep2Active ? 'none' : '1px solid var(--border-color)',
            boxShadow: isStep2Active ? '0 0 12px rgba(168, 85, 247, 0.4)' : 'none',
            transition: 'all 0.3s ease'
          }}>2</div>
          <div className="step-desc" style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '13px', color: isStep2Active ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}>PageRank Analysis</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Calculate Centrality weights</span>
          </div>
        </div>

        <ArrowRight size={16} className="timeline-arrow" style={{ color: isStep2Active ? 'var(--accent-purple)' : 'var(--text-tertiary)', opacity: 0.6, flexShrink: 0 }} />

        {/* Step 3 */}
        <div className={`progress-step-indicator ${isStep3Active ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px' }}>
          <div className="step-num" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: isStep3Active ? 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)' : 'var(--bg-tertiary)', 
            color: isStep3Active ? '#fff' : 'var(--text-secondary)', 
            fontWeight: 'bold',
            border: isStep3Active ? 'none' : '1px solid var(--border-color)',
            boxShadow: isStep3Active ? '0 0 12px rgba(236, 72, 153, 0.4)' : 'none',
            transition: 'all 0.3s ease'
          }}>3</div>
          <div className="step-desc" style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '13px', color: isStep3Active ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}>Semantic Harvesting</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Trigger targeted WRX quads</span>
          </div>
        </div>
      </div>

      {/* Split Grid for Controls and Log console */}
      <div className="agent-dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Controls Card */}
        <div className="agent-controls-card flex-col glass-card" style={{ gap: '1.25rem', height: '100%', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div>
            <div className="agent-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>Autocrawl Settings</h4>
              {currentPhase !== 'idle' && (
                <button type="button" className="settings-toggle-btn" onClick={resetAutocrawl} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <ListRestart size={12} />
                  Reset Crawler
                </button>
              )}
            </div>

            <div className="settings-field always-visible-endpoint" style={{ marginTop: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Entrypoint Seed URI</label>
              <input
                type="text"
                readOnly
                value={selectedUri || 'Please select a URI first...'}
                className="font-mono"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)', 
                  border: '1px solid rgba(6, 182, 212, 0.3)', 
                  borderRadius: '8px', 
                  color: 'var(--accent-cyan)', 
                  fontSize: '12px',
                  fontWeight: '700',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1), 0 2px 10px rgba(6, 182, 212, 0.06)'
                }}
              />
            </div>

            {/* Max Search Depth Slider */}
            <div className="settings-field crawler-limit-field" style={{ marginTop: '1.25rem' }}>
              <div className="slider-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Max Search Depth</label>
                <span className="slider-val-badge font-semibold text-glow-purple" style={{ fontSize: '12px', color: 'var(--accent-purple)' }}>{maxDepth} depth</span>
              </div>
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
                className="settings-slider"
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={currentPhase === 'html-crawling' || currentPhase === 'semantic-harvesting'}
              />
              <p className="slider-hint" style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Defines how many link hops away from the seed node the BFS HTML crawler will traverse.</p>
            </div>

            {/* Smart Crawl Delay Slider */}
            <div className="settings-field crawler-limit-field" style={{ marginTop: '1.25rem' }}>
              <div className="slider-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Smart Queue Fetch Delay</label>
                <span className="slider-val-badge font-semibold text-glow-cyan" style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{crawlDelay} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="100"
                value={crawlDelay}
                onChange={(e) => setCrawlDelay(parseInt(e.target.value, 10))}
                className="settings-slider"
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={currentPhase === 'html-crawling' || currentPhase === 'semantic-harvesting'}
              />
              <p className="slider-hint" style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Sequences BFS fetches with delayed sleep breaks to completely prevent HTTP 429 rate limit triggers.</p>
            </div>

            {/* Background Tab Emulator Checkbox */}
            <div className="settings-field" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="useTabRendering"
                checked={useTabRendering}
                onChange={(e) => setUseTabRendering(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
                disabled={currentPhase === 'html-crawling' || currentPhase === 'semantic-harvesting'}
              />
              <label htmlFor="useTabRendering" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)' }}>
                Enable SPA Tab-Rendering (Headless Emulator)
              </label>
            </div>
          </div>

          <div className="agent-action-buttons" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            {currentPhase === 'idle' && (
              <button
                type="button"
                disabled={!selectedUri}
                onClick={handleStartCrawl}
                className="agent-btn start-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', cursor: selectedUri ? 'pointer' : 'not-allowed', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0891b2 100%)', border: 'none', color: '#020617', fontWeight: 'bold' }}
              >
                <Play size={14} />
                Launch Phase 1 BFS Crawl
              </button>
            )}

            {currentPhase === 'html-complete' && (
              <button
                type="button"
                onClick={runTripleHarvest}
                className="agent-btn start-btn animate-pulse"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #a855f7 100%)', border: 'none', color: '#fff', fontWeight: 'bold', boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)' }}
              >
                <Sparkles size={14} />
                Launch Phase 2 RDF Harvest
              </button>
            )}

            {(currentPhase === 'html-crawling' || currentPhase === 'semantic-harvesting') && (
              <div className="crawler-status-indicator flex-center font-semibold text-glow-cyan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: '1px dashed var(--accent-cyan)', borderRadius: '8px', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.05)' }}>
                <Loader2 className="spinner" size={16} />
                {currentPhase === 'html-crawling' ? 'Web Links Crawling' : 'Triple Quads Harvesting'} [
                {progress.current} / {progress.total}]
              </div>
            )}

            {currentPhase === 'semantic-complete' && (
              <div className="crawler-status-indicator flex-center font-semibold text-glow-purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: '1px solid var(--accent-purple)', borderRadius: '8px', color: 'var(--accent-purple)', background: 'rgba(168, 85, 247, 0.05)' }}>
                🎉 Network Analysis Finished Successfully!
              </div>
            )}
          </div>
        </div>

        {/* Live Terminal Console Logs */}
        <div className="agent-results-card glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '420px', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
          <div className="agent-card-header" style={{ marginBottom: '1rem' }}>
            <h4>Live Console Output Logs</h4>
          </div>
          <div className="terminal-timeline-wrapper" ref={scrollRef} style={{ 
            flex: 1, 
            overflowY: 'auto', 
            maxHeight: '340px', 
            background: '#090d16', 
            padding: '16px', 
            borderRadius: '8px', 
            border: '1px solid rgba(6, 182, 212, 0.25)',
            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            {crawlLog.length === 0 ? (
              <div className="agent-session-idle flex-center" style={{ padding: '6rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-tertiary)' }}>
                <Bot size={48} className="idle-bot-icon animate-bounce" style={{ color: 'rgba(6, 182, 212, 0.4)' }} />
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' }}>Crawler terminal is idle. Select Explore/Autocrawl segment toggler and run the crawler.</p>
              </div>
            ) : (
              crawlLog.map((logStr, i) => renderLogEntry(logStr, i))
            )}
          </div>
        </div>
      </div>

      {/* Phase 1 Completion Modal Overlay */}
      {showHtmlModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 15, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="glass-card flex-col" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.25)',
            background: '#090d16',
            gap: '1.25rem',
            textAlign: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4'
            }}>
              <Network size={28} className="animate-pulse" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Phase 1 Complete: Web Topology Crawled!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                The sequential BFS crawler has mapped the web hyperlinks of your seed entrypoint. Ready to harvest semantic RDF quads from structural authorities.
              </p>
            </div>
            <button
              onClick={() => setShowHtmlModal(false)}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #06b6d4 100%)',
                border: 'none',
                color: '#020617',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.35)',
                width: '100%'
              }}
            >
              Acknowledge &amp; Proceed to Phase 2
            </button>
          </div>
        </div>
      )}

      {/* Phase 2 Completion Modal Overlay */}
      {showSemanticModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 15, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="glass-card flex-col" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 0 30px rgba(168, 85, 247, 0.25)',
            background: '#090d16',
            gap: '1.25rem',
            textAlign: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)'
            }}>
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Phase 2 Complete: Semantic Harvest Solved!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                Targeted triple extractions and Personalized PageRank centrality algorithms have finished compiling. Your custom site topology maps are ready for review.
              </p>
            </div>
            <button
              onClick={() => setShowSemanticModal(false)}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-purple) 0%, #a855f7 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)',
                width: '100%'
              }}
            >
              Explore Semantic Ranks &amp; Graphs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
