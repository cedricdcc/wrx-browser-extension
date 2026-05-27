import { Sparkles, Network, BookOpen, Key, ArrowRight } from 'lucide-react';
import { AutocrawlNode, AutocrawlEdge } from '../../../hooks/useAutocrawl';
import { AutocrawlNetworkGraph } from './AutocrawlNetworkGraph';

interface AutocrawlReportProps {
  nodes: AutocrawlNode[];
  edges: AutocrawlEdge[];
  keywordCloud: Record<string, number>;
}

interface PathStep {
  nodeId: string;
  edgeLabel?: string;
  type?: 'link' | 'triple';
}

// Shortest pathfinder traversing crawled edges from seedUrl to targetId using BFS
function findShortestPath(seedUrl: string, targetId: string, edges: AutocrawlEdge[]): PathStep[] | null {
  if (seedUrl === targetId) {
    return [{ nodeId: seedUrl }];
  }

  const queue: PathStep[][] = [[{ nodeId: seedUrl }]];
  const visited = new Set<string>([seedUrl]);

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const lastStep = currentPath[currentPath.length - 1];

    // Find all outgoing edges from the last node in the path
    const outgoing = edges.filter(e => e.source === lastStep.nodeId);

    for (const edge of outgoing) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        const newPath: PathStep[] = [
          ...currentPath.slice(0, currentPath.length - 1),
          { ...lastStep, edgeLabel: edge.label, type: edge.type },
          { nodeId: edge.target }
        ];

        if (edge.target === targetId) {
          return newPath;
        }
        queue.push(newPath);
      }
    }
  }

  return null;
}

export const AutocrawlReport = ({ nodes, edges, keywordCloud }: AutocrawlReportProps) => {
  // Empty state handling
  if (nodes.length === 0) {
    return (
      <div className="tab-panel flex-col flex-center" style={{ padding: '6rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Network size={64} className="text-glow-cyan animate-pulse" style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem' }} />
        <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Executive Centrality Report is Empty</h3>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '480px', marginTop: '8px', fontSize: '13px', lineHeight: '1.5' }}>
          Please navigate to the Autocrawl Settings console, select an entrypoint seed URL, and launch the crawler to compile the central network report.
        </p>
      </div>
    );
  }

  // Extract seed URL and top 5 nodes
  const seedNode = nodes.find(n => n.depth === 0) || nodes[0];
  const seedUrl = seedNode?.id || '';
  const topFiveNodes = nodes.slice(0, 5);
  const coreNodeIds = new Set(topFiveNodes.map(n => n.id));
  if (seedUrl) coreNodeIds.add(seedUrl);

  // Filter down nodes and edges to ONLY seed + top 5 nodes for focused visual report
  const coreNodes = nodes.filter(n => coreNodeIds.has(n.id));
  const coreEdges = edges.filter(e => coreNodeIds.has(e.source) && coreNodeIds.has(e.target));

  // Get top 10 descriptive HTML keywords
  const sortedKeywords = Object.entries(keywordCloud)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const renderPathBreadcrumbs = (path: PathStep[]) => {
    return (
      <div className="flex-center font-mono text-xs" style={{ 
        flexWrap: 'wrap', 
        gap: '6px', 
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%)', 
        padding: '10px 14px', 
        borderRadius: '8px', 
        border: '1px solid rgba(6, 182, 212, 0.15)',
        boxShadow: '0 4px 20px rgba(6, 182, 212, 0.05)',
        backdropFilter: 'blur(8px)',
        marginTop: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%'
      }}>
        <span className="font-bold" style={{ color: 'var(--accent-cyan)', marginRight: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Crawl Path:</span>
        {path.map((step, idx) => {
          const isLast = idx === path.length - 1;
          const shortNodeName = step.nodeId.replace('https://', '').replace('http://', '');
          
          return (
            <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span 
                title={step.nodeId}
                style={{ 
                  color: isLast ? 'var(--accent-purple)' : 'var(--text-primary)',
                  fontWeight: isLast ? 'bold' : '500',
                  background: isLast ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: isLast ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid var(--border-color)',
                  fontSize: '11px'
                }}
              >
                {shortNodeName.slice(0, 26)}{shortNodeName.length > 26 ? '...' : ''}
              </span>
              {!isLast && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)' }}>
                  <span style={{ 
                    fontSize: '9px', 
                    textTransform: 'uppercase', 
                    fontWeight: 'bold',
                    background: step.type === 'triple' ? 'rgba(168,85,247,0.15)' : 'rgba(6,182,212,0.15)', 
                    color: step.type === 'triple' ? 'var(--accent-purple)' : 'var(--accent-cyan)', 
                    padding: '2px 5px', 
                    borderRadius: '4px', 
                    border: `1px solid ${step.type === 'triple' ? 'rgba(168,85,247,0.25)' : 'rgba(6,182,212,0.25)'}`,
                    letterSpacing: '0.02em'
                  }}>
                    {step.edgeLabel || 'linksTo'}
                  </span>
                  <ArrowRight size={12} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="tab-panel flex-col" style={{ gap: '2rem' }}>
      {/* Intro section */}
      <div className="trace-intro">
        <h3 className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
          <Sparkles size={20} className="text-glow-purple" />
          Semantic Traversal & Executive Analysis Report
        </h3>
        <p>
          An automated breakdown mapping core web authority structures, parsed HTML page descriptions, and semantic concepts discovered in your network neighborhood.
        </p>
      </div>

      <div className="analytics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Core Authority mini-graph visualizer */}
        <div className="chart-card flex-col" style={{ gap: '1rem', minHeight: '380px' }}>
          <h4 className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <Network size={16} className="text-glow-cyan" />
            Core Authority Graph (Seed + Top 5 nodes)
          </h4>
          <p className="no-data-text" style={{ fontSize: '12px', margin: 0 }}>
            This focused view filters out peripheral nodes to display only the direct structural backbones of your crawled target.
          </p>
          <div style={{ flex: 1, minHeight: '260px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            <AutocrawlNetworkGraph nodes={coreNodes} edges={coreEdges} />
          </div>
        </div>

        {/* HTML Keywords Tag frequency bar charts */}
        <div className="chart-card flex-col" style={{ gap: '1rem' }}>
          <h4 className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <Key size={16} className="text-glow-purple" />
            Top Descriptive HTML Keywords Frequency
          </h4>
          {sortedKeywords.length === 0 ? (
            <div className="flex-center" style={{ flex: 1, padding: '2rem' }}>
              <p className="no-data-text">No keyword tags parsed from crawled HTML files yet.</p>
            </div>
          ) : (
            <div className="histogram-flow" style={{ flex: 1 }}>
              {sortedKeywords.map(([word, count]) => {
                const max = sortedKeywords[0] ? sortedKeywords[0][1] : 1;
                const percent = (count / max) * 100;
                return (
                  <div className="histogram-item" key={word}>
                    <span className="histogram-label font-mono font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                      #{word}
                    </span>
                    <div className="histogram-bar-wrapper">
                      <div className="histogram-bar purple" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="histogram-val">{count} mentions</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Renders descriptive index blocks of top authorities */}
      <div className="chart-card flex-col" style={{ gap: '1.25rem' }}>
        <h4 className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
          <BookOpen size={16} className="text-glow-cyan" />
          Index of High Centrality Web Documents
        </h4>
        <div className="analytics-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem', width: '100%' }}>
          {topFiveNodes.map((node, index) => {
            const shortUrl = node.id.replace('https://', '').replace('http://', '');
            const shortestPath = findShortestPath(seedUrl, node.id, edges);

            return (
              <div 
                key={node.id} 
                className="glass-card" 
                style={{ 
                  padding: '1.25rem', 
                  borderRadius: '10px', 
                  borderLeft: `4px solid ${index === 0 ? 'var(--accent-purple)' : 'var(--accent-cyan)'}`,
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid var(--border-color)',
                  borderLeftWidth: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="font-mono text-xs text-glow-cyan font-bold">
                    RANK #{index + 1} (PageRank: {(node.pageRank * 100).toFixed(2)}%)
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>
                      Depth Discovered: {node.depth === 0 ? 'Seed' : `#${node.depth}`}
                    </span>
                    <span className={`node-badge ${node.harvested ? 'predicate' : 'literal'}`} style={{ fontSize: '10px' }}>
                      {node.harvested ? 'Harvested RDF' : 'HTML Page'}
                    </span>
                  </div>
                </div>
                <h5 className="font-semibold text-sm" style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {node.title || shortUrl}
                </h5>
                <p className="font-mono text-xs text-glow-purple" style={{ wordBreak: 'break-all', marginBottom: '8px', color: 'var(--accent-purple)', opacity: 0.8 }}>
                  {node.id}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {node.description || 'No meta description found on this webpage.'}
                </p>

                {/* Shortest Property Path Breadcrumbs */}
                {shortestPath && shortestPath.length > 0 && renderPathBreadcrumbs(shortestPath)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
