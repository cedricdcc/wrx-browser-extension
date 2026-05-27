import { Github, Network, Compass, Brain } from 'lucide-react';
import { StitchLogo } from '../../ui/StitchLogo';

export const AboutTab = () => {
  return (
    <div className="tab-panel flex-col about-panel animate-fadeIn" style={{ gap: '2rem', padding: '2rem 1.5rem' }}>
      
      {/* Hero Header Section */}
      <div className="about-hero flex-center" style={{ 
        flexDirection: 'column',
        textAlign: 'center', 
        padding: '2.5rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(168, 85, 247, 0.04) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow backdrop decorator */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '180px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <StitchLogo size={96} style={{ filter: 'drop-shadow(0 4px 20px rgba(6, 182, 212, 0.25))', marginBottom: '1.25rem' }} />
          <h2 className="font-mono text-glow-cyan" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', textAlign: 'center' }}>
            Site Topology &amp; Interconnectivity Trace CHain
          </h2>
          <h1 style={{ fontSize: '38px', fontWeight: '950', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.0 }}>
            STITCH
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px', lineHeight: '1.6', margin: '0 auto 1.5rem' }}>
            A high-performance semantic web exploration framework engineered to crawl, harvest, and lace fragmented web pages and secondary RDF triples into unified navigation topologies.
          </p>

          <a 
            href="https://github.com/cedricdcc/wrx-browser-extension" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-center"
            style={{ 
              gap: '8px', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              background: '#090d16', 
              border: '1px solid rgba(6, 182, 212, 0.3)', 
              color: '#ffffff', 
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <Github size={16} />
            View on GitHub Repository
          </a>
        </div>
      </div>

      {/* Grid of Core Pillars */}
      <div className="about-pillars-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {/* Pillar 1 */}
        <div className="glass-card flex-col" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '10px' }}>
          <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', justifyContent: 'center' }}>
            <Network size={20} />
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Site Topology Crawler</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Performs programmatic sequential BFS crawls utilizing active browser tab injectors to scrap and index hidden outgoing HTML anchors, avoiding rate-limiting barriers.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="glass-card flex-col" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '10px' }}>
          <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)', justifyContent: 'center' }}>
            <Compass size={20} />
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Personalized PageRank</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Directs network sink-sums and damping redistributions back to the exploration seed, highlighting top local authorities and tracing clear topological backbones.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="glass-card flex-col" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '10px' }}>
          <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', justifyContent: 'center' }}>
            <Brain size={20} />
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>AI Discovery Agent</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Leverages autonomous reasoning models to run deep semantic traversal traces, resolving SHACL constraints and querying remote triplestores natively.
          </p>
        </div>
      </div>
    </div>
  );
};
