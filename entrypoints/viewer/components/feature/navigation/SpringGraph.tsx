import { Quad } from 'n3';

interface SpringGraphProps {
  graphNodes: any[];
  navigationEdges: any[];
  triples: Quad[];
  visitedNodes: any[];
  selectedUri: string;
  onSelectNode: (uri: string) => void;
  onMouseDown: (nodeId: string, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp: () => void;
}

export const SpringGraph = ({
  graphNodes,
  navigationEdges,
  triples,
  visitedNodes,
  selectedUri,
  onSelectNode,
  onMouseDown,
  onMouseMove,
  onMouseUp
}: SpringGraphProps) => {
  return (
    <div className="graph-wrapper">
      <svg
        className="nav-svg-graph"
        viewBox="0 0 800 480"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="20"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-purple)" />
          </marker>
        </defs>

        {/* Render Directed Relationship Edges */}
        {navigationEdges.map((edge, i) => {
          const fromNode = graphNodes.find(n => n.id === edge.source);
          const toNode = graphNodes.find(n => n.id === edge.target);
          if (!fromNode || !toNode) return null;

          const mx = (fromNode.x + toNode.x) / 2;
          const my = (fromNode.y + toNode.y) / 2;

          return (
            <g key={i}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                className="graph-edge-line"
                markerEnd="url(#arrow)"
              />
              <rect
                x={mx - 22}
                y={my - 6}
                width={44}
                height={12}
                rx={2}
                className="graph-edge-label-bg"
              />
              <text
                x={mx}
                y={my + 2}
                className="graph-edge-label-text"
                textAnchor="middle"
              >
                {edge.label.split('#').pop()?.split('/').pop()}
              </text>
            </g>
          );
        })}

        {/* Render Visited Nodes */}
        {graphNodes.map((node) => {
          const isSelected = node.id === selectedUri;
          const isSeed = visitedNodes[0]?.id === node.id;
          const harvestCount = triples.filter(t => t.graph.value === node.id).length;
          const nodeRadius = Math.min(48, Math.max(12, 12 + Math.sqrt(harvestCount) * 2));

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onSelectNode(node.id)}
              onMouseDown={(e) => onMouseDown(node.id, e)}
              className={`graph-node-group ${isSelected ? 'selected' : ''} ${isSeed ? 'seed' : ''}`}
            >
              <circle r={nodeRadius} className="graph-node-circle" />
              <text y={nodeRadius + 14} className="graph-node-text" textAnchor="middle">
                {node.label.replace('https://', '').replace('http://', '').slice(0, 16)}
                {node.label.length > 16 ? '...' : ''}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Dynamic Node Size Legend Overlay */}
      <div className="graph-size-legend glass-card">
        <div className="legend-title">Triples Harvested</div>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-circle size-small"></span>
            <span className="legend-label">Small (0)</span>
          </div>
          <div className="legend-item">
            <span className="legend-circle size-medium"></span>
            <span className="legend-label">Medium (1-99)</span>
          </div>
          <div className="legend-item">
            <span className="legend-circle size-large"></span>
            <span className="legend-label">Large (100-999)</span>
          </div>
          <div className="legend-item">
            <span className="legend-circle size-mega"></span>
            <span className="legend-label">Mega (1K+, Max Capped)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
