import { useState, useEffect, useRef } from 'react';
import { AutocrawlNode, AutocrawlEdge } from '../../../hooks/useAutocrawl';

interface AutocrawlNetworkGraphProps {
  nodes: AutocrawlNode[];
  edges: AutocrawlEdge[];
}

interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  pageRank: number;
  type: 'html' | 'semantic';
  harvested: boolean;
  depth: number;
}

export const AutocrawlNetworkGraph = ({ nodes, edges }: AutocrawlNetworkGraphProps) => {
  const [graphNodes, setGraphNodes] = useState<PositionedNode[]>([]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  // Tooltip tracking states
  const [hoveredNode, setHoveredNode] = useState<PositionedNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Concentric Radial Spider Layout with Zig-Zag nesting
  useEffect(() => {
    if (nodes.length === 0) {
      setGraphNodes([]);
      return;
    }

    const cx = 400;
    const cy = 240;

    // Group nodes by depth
    const depthGroups: Record<number, AutocrawlNode[]> = {};
    nodes.forEach(node => {
      const d = node.depth ?? 0;
      if (!depthGroups[d]) {
        depthGroups[d] = [];
      }
      depthGroups[d].push(node);
    });

    const newPositionedNodes: PositionedNode[] = [];

    // Calculate dynamic coordinates
    Object.keys(depthGroups).forEach(depthKey => {
      const d = parseInt(depthKey, 10);
      const group = depthGroups[d];
      const M = group.length;

      group.forEach((node, i) => {
        // Base radius is 90px per depth. If the group has too many nodes, we expand the base circle.
        let baseR = d * 90;
        
        // Expand circle if there are too many nodes to preserve separation
        const minSpacingFactor = 8.5; 
        if (M * minSpacingFactor > baseR && d > 0) {
          baseR = M * minSpacingFactor;
        }

        // ZIG-ZAG DOUBLE RING: Alternating radii to double the layout capacity and prevent overlaps
        let R = baseR;
        if (M > 10 && d > 0) {
          R = baseR + (i % 2 === 0 ? -22 : 22);
        }

        // Distribute angles evenly around 2PI, skewed by layer depth to avoid radial stacking
        const angleOffset = d * 0.45;
        const theta = M > 0 ? (i * (2 * Math.PI) / M) + angleOffset : 0;

        let x = cx;
        let y = cy;

        if (d > 0) {
          x = cx + R * Math.cos(theta);
          y = cy + R * Math.sin(theta);
        }

        // Keep inside bounds with boundary padding
        x = Math.max(35, Math.min(765, x));
        y = Math.max(35, Math.min(445, y));

        // If this node is being actively dragged, preserve its dragged position
        const existing = graphNodes.find(gn => gn.id === node.id);
        if (existing && draggedNodeId === node.id) {
          x = existing.x;
          y = existing.y;
        }

        newPositionedNodes.push({
          id: node.id,
          label: node.label,
          x,
          y,
          pageRank: node.pageRank,
          type: node.type,
          harvested: node.harvested,
          depth: d
        });
      });
    });

    setGraphNodes(newPositionedNodes);
  }, [nodes]);

  const handleSVGMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedNodeId(nodeId);
  };

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNodeId) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 480;

    setGraphNodes(prev => {
      return prev.map(n => {
        if (n.id === draggedNodeId) {
          return { 
            ...n, 
            x: Math.max(30, Math.min(770, x)), 
            y: Math.max(30, Math.min(450, y)) 
          };
        }
        return n;
      });
    });
  };

  const handleSVGMouseUpOrLeave = () => {
    setDraggedNodeId(null);
  };

  const handleWrapperMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Determine if a node should render text label statically
  const shouldRenderLabel = (node: PositionedNode) => {
    const isSeed = node.depth === 0;
    const isMajorHub = node.pageRank > 0.045;
    const totalNodesCount = graphNodes.length;
    
    // Always render labels if graph is very small, otherwise only hub/seed
    return isSeed || isMajorHub || totalNodesCount <= 8;
  };

  return (
    <div 
      className="graph-wrapper autocrawl-graph-wrapper animate-fadeIn" 
      ref={wrapperRef}
      onMouseMove={handleWrapperMouseMove}
      style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
    >
      <svg
        className="nav-svg-graph"
        viewBox="0 0 800 480"
        onMouseMove={handleSVGMouseMove}
        onMouseUp={handleSVGMouseUpOrLeave}
        onMouseLeave={handleSVGMouseUpOrLeave}
        style={{ 
          background: 'radial-gradient(circle at center, #0a0f1d 0%, #03050a 100%)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
        }}
      >
        <defs>
          <marker
            id="autocrawl-arrow-cyan"
            viewBox="0 0 10 10"
            refX="16"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-cyan)" />
          </marker>
          <marker
            id="autocrawl-arrow-purple"
            viewBox="0 0 10 10"
            refX="16"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-purple)" />
          </marker>

          {/* Glowing cyber grid pattern in background */}
          <pattern id="cyber-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.02)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Apply background cyber grid pattern */}
        <rect width="800" height="480" fill="url(#cyber-grid)" />

        {/* Concentric Guide Depth Rings */}
        {[1, 2, 3, 4, 5].map(d => {
          // Find standard radius for guide ring representation
          const hasNodesAtDepth = graphNodes.some(n => n.depth === d);
          if (!hasNodesAtDepth) return null;

          const group = graphNodes.filter(n => n.depth === d);
          let R = d * 90;
          if (group.length * 8.5 > R) {
            R = group.length * 8.5;
          }

          return (
            <g key={d}>
              <circle
                cx={400}
                cy={240}
                r={R}
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeDasharray="4 8"
                strokeWidth={1.5}
              />
              {/* Double rings visualizer indicators for high densities */}
              {group.length > 10 && (
                <>
                  <circle cx={400} cy={240} r={R - 22} fill="none" stroke="rgba(255, 255, 255, 0.01)" strokeDasharray="2 6" strokeWidth={1} />
                  <circle cx={400} cy={240} r={R + 22} fill="none" stroke="rgba(255, 255, 255, 0.01)" strokeDasharray="2 6" strokeWidth={1} />
                </>
              )}
              <text 
                x={400} 
                y={240 - R + 14} 
                fill="var(--text-tertiary)" 
                fontSize="8px" 
                fontWeight="800" 
                letterSpacing="0.08em"
                textAnchor="middle"
                opacity={0.6}
              >
                DEPTH LAYER #{d}
              </text>
            </g>
          );
        })}

        {/* Directed Relationship Edges */}
        {edges.map((edge, i) => {
          const fromNode = graphNodes.find(n => n.id === edge.source);
          const toNode = graphNodes.find(n => n.id === edge.target);
          if (!fromNode || !toNode) return null;

          const isTriple = edge.type === 'triple';

          return (
            <g key={i}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                className="graph-edge-line"
                style={{ 
                  stroke: isTriple ? 'var(--accent-purple)' : 'var(--accent-cyan)', 
                  strokeOpacity: isTriple ? 0.5 : 0.35,
                  strokeWidth: isTriple ? 1.8 : 1.2,
                  strokeDasharray: isTriple ? 'none' : '3 3' 
                }}
                markerEnd={isTriple ? 'url(#autocrawl-arrow-purple)' : 'url(#autocrawl-arrow-cyan)'}
              />
            </g>
          );
        })}

        {/* Render Concentric Nodes */}
        {graphNodes.map((node) => {
          const isSeed = node.depth === 0;
          // Clean node radius bounds to prevent enormous bubbles overlapping
          const nodeRadius = isSeed 
            ? 22 
            : Math.min(30, Math.max(7, 7 + Math.sqrt(node.pageRank * 100) * 5.5));

          const isHovered = hoveredNode?.id === node.id;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={(e) => handleSVGMouseDown(node.id, e)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`graph-node-group ${isSeed ? 'seed' : ''} ${node.harvested ? 'selected' : ''}`}
              style={{ cursor: 'grab' }}
            >
              {/* Outer pulsing ring for hovering/dragging feedback */}
              {(isSeed || isHovered) && (
                <circle
                  r={nodeRadius + (isHovered ? 5 : 6)}
                  fill="none"
                  stroke={node.type === 'semantic' ? 'var(--accent-purple)' : 'var(--accent-cyan)'}
                  strokeWidth={1.5}
                  className="animate-pulse"
                  style={{ opacity: isHovered ? 0.6 : 0.3 }}
                />
              )}
              
              <circle 
                r={nodeRadius} 
                className="graph-node-circle" 
                style={{ 
                  fill: node.type === 'semantic' ? 'var(--accent-purple)' : 'var(--accent-cyan)',
                  stroke: node.harvested ? 'var(--accent-purple)' : 'none',
                  strokeWidth: node.harvested ? 2.5 : 0,
                  filter: isHovered 
                    ? `drop-shadow(0 0 8px ${node.type === 'semantic' ? 'var(--accent-purple)' : 'var(--accent-cyan)'})`
                    : 'none',
                  transition: 'r 0.15s ease, filter 0.15s ease'
                }}
              />

              {/* Harvested nested ring */}
              {node.harvested && !isSeed && (
                <circle
                  r={nodeRadius + 3.5}
                  fill="none"
                  stroke="var(--accent-purple)"
                  strokeWidth={1.2}
                  style={{ opacity: 0.7 }}
                />
              )}

              {/* Text Label Backdrop - Rendered conditionally to prevent mess */}
              {shouldRenderLabel(node) && (
                <text 
                  y={nodeRadius + 14} 
                  className="graph-node-text animate-fadeIn" 
                  textAnchor="middle"
                  style={{ 
                    fontSize: '9px', 
                    fontWeight: isSeed ? 'bold' : '600', 
                    fill: 'var(--text-primary)',
                    paintOrder: 'stroke',
                    stroke: 'rgba(5, 5, 10, 0.95)',
                    strokeWidth: '3px',
                    strokeLinejoin: 'round',
                    pointerEvents: 'none'
                  }}
                >
                  {node.label.replace('https://', '').replace('http://', '').slice(0, 16)}
                  {node.label.length > 16 ? '...' : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Cyber Hover Tooltip details card */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          left: `${mousePos.x + 16}px`,
          top: `${mousePos.y + 16}px`,
          background: 'rgba(9, 13, 22, 0.96)',
          border: `1px solid ${hoveredNode.type === 'semantic' ? 'var(--accent-purple)' : 'var(--accent-cyan)'}`,
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 10px rgba(6, 182, 212, 0.15)',
          color: '#ffffff',
          fontSize: '11px',
          pointerEvents: 'none',
          zIndex: 100,
          maxWidth: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          fontFamily: 'monospace',
          animation: 'fadeIn 0.1s ease'
        }}>
          <div style={{ fontWeight: 'bold', color: hoveredNode.type === 'semantic' ? 'var(--accent-purple)' : 'var(--accent-cyan)', wordBreak: 'break-all', fontSize: '11.5px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px' }}>
            {hoveredNode.label}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Node Class:</span>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{hoveredNode.type}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>BFS Layer Depth:</span>
            <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>#{hoveredNode.depth}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Personalized PageRank:</span>
            <span style={{ fontWeight: 'bold', color: 'var(--accent-purple)' }}>{(hoveredNode.pageRank * 100).toFixed(4)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Quads Harvested:</span>
            <span style={{ fontWeight: 'bold', color: hoveredNode.harvested ? '#34d399' : 'var(--text-tertiary)' }}>
              {hoveredNode.harvested ? 'YES' : 'PENDING'}
            </span>
          </div>
        </div>
      )}

      {/* Centrality Legend Overlay */}
      <div className="graph-size-legend glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(15,15,30,0.85)', marginTop: '8px' }}>
        <div className="legend-title" style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Personalized PageRank Centrality Network
        </div>
        <div className="legend-items" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="legend-circle" style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }}></span>
            <span className="legend-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>HTML Web Page</span>
          </div>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="legend-circle" style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }}></span>
            <span className="legend-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>RDF Semantic Node</span>
          </div>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="legend-circle" style={{ width: '9px', height: '9px', borderRadius: '50%', border: '2px solid var(--accent-purple)', backgroundColor: 'transparent' }}></span>
            <span className="legend-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Harvested Node</span>
          </div>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>* Hover over any node to view detailed URL &amp; PageRank metrics.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
