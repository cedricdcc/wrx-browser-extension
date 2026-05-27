import { useState, useEffect } from 'react';
import { Quad } from 'n3';

interface VisitedNode {
  id: string;
  label: string;
  depth: number;
}

interface NavEdge {
  source: string;
  target: string;
  label: string;
}

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface UsePhysicsLayoutProps {
  visitedNodes: VisitedNode[];
  navigationEdges: NavEdge[];
  triplesRef: React.MutableRefObject<Quad[]>;
  activeTab: string;
  graphViewMode: 'spring' | 'treeList';
}

export const usePhysicsLayout = ({
  visitedNodes,
  navigationEdges,
  triplesRef,
  activeTab,
  graphViewMode
}: UsePhysicsLayoutProps) => {
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Sync graphNodes with visitedNodes, adding new nodes near parent/center
  useEffect(() => {
    setGraphNodes(prev => {
      const newNodes = visitedNodes.filter(n => !prev.some(pn => pn.id === n.id));
      if (newNodes.length === 0 && prev.length === visitedNodes.length) return prev;

      const updated = prev.filter(pn => visitedNodes.some(vn => vn.id === pn.id));
      
      newNodes.forEach(nn => {
        const edge = navigationEdges.find(e => e.target === nn.id);
        const parent = edge ? updated.find(pn => pn.id === edge.source) : null;
        
        const cx = 400;
        const cy = 240;
        
        const x = parent ? parent.x + (Math.random() - 0.5) * 50 : cx + (Math.random() - 0.5) * 50;
        const y = parent ? parent.y + (Math.random() - 0.5) * 50 : cy + (Math.random() - 0.5) * 50;
        
        updated.push({
          id: nn.id,
          label: nn.label,
          x,
          y,
          vx: 0,
          vy: 0
        });
      });
      
      return updated;
    });
  }, [visitedNodes, navigationEdges]);

  // Spring Physics loop (forces repulsion, attraction along edges, and center gravity pull)
  useEffect(() => {
    if (activeTab !== 'graph' || graphViewMode !== 'spring' || graphNodes.length === 0) return;
    
    let animationId: number;
    
    const tick = () => {
      setGraphNodes(prev => {
        const nodes = prev.map(n => ({ ...n }));
        const n = nodes.length;
        
        const kRep = 3500; // Massive repulsion constant
        const kAtt = 0.04; // Attraction constant
        const kGrav = 0.006; // Light gravity constant
        const lDesired = 160; // Expanded desired link length
        const damping = 0.85; // Damping constant
        
        const cx = 400;
        const cy = 240;
        
        const activeTriples = triplesRef.current;
        const seedId = visitedNodes[0]?.id;
        
        // Precompute node radii based on triples harvested
        const radii = nodes.map(node => {
          const harvestCount = activeTriples.filter(t => t.graph.value === node.id).length;
          return Math.min(48, Math.max(12, 12 + Math.sqrt(harvestCount) * 2));
        });
        
        // 1. Repulsion between all pairs of nodes
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);
            
            const force = kRep / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
        
        // 2. Attraction along navigation edges
        navigationEdges.forEach(edge => {
          const u = nodes.find(x => x.id === edge.source);
          const v = nodes.find(x => x.id === edge.target);
          if (!u || !v) return;
          
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = kAtt * (dist - lDesired);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          u.vx += fx;
          u.vy += fy;
          v.vx -= fx;
          v.vy -= fy;
        });
        
        // 3. Gravity & Update Positions
        nodes.forEach(node => {
          const isSeed = seedId === node.id;
          if (isSeed) {
            node.x = cx;
            node.y = cy;
            node.vx = 0;
            node.vy = 0;
            return;
          }

          if (node.id === draggedNodeId) {
            node.vx = 0;
            node.vy = 0;
            return;
          }
          
          const dx = cx - node.x;
          const dy = cy - node.y;
          node.vx += dx * kGrav;
          node.vy += dy * kGrav;
          
          node.x += node.vx;
          node.y += node.vy;
          
          node.vx *= damping;
          node.vy *= damping;
        });
        
        // 4. Position-based Collision Resolution to strictly prevent overlap
        for (let iter = 0; iter < 3; iter++) {
          for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
              const nodeI = nodes[i];
              const nodeJ = nodes[j];
              const rI = radii[i];
              const rJ = radii[j];
              
              const dx = nodeJ.x - nodeI.x;
              const dy = nodeJ.y - nodeI.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const minDist = rI + rJ + 12; // Safety padding of 12px
              
              if (dist < minDist) {
                const overlap = minDist - dist;
                const ux = dx / dist;
                const uy = dy / dist;
                
                const isSeedI = seedId === nodeI.id;
                const isSeedJ = seedId === nodeJ.id;
                
                if (isSeedI && isSeedJ) {
                  continue;
                } else if (isSeedI) {
                  nodeJ.x += ux * overlap;
                  nodeJ.y += uy * overlap;
                } else if (isSeedJ) {
                  nodeI.x -= ux * overlap;
                  nodeI.y -= uy * overlap;
                } else {
                  nodeI.x -= ux * overlap * 0.5;
                  nodeI.y -= uy * overlap * 0.5;
                  nodeJ.x += ux * overlap * 0.5;
                  nodeJ.y += uy * overlap * 0.5;
                }
              }
            }
          }
        }
        
        // 5. Bounds Constraints (accounting for radius)
        nodes.forEach((node, idx) => {
          const isSeed = seedId === node.id;
          if (isSeed) return;
          
          const r = radii[idx];
          const paddingX = r + 10;
          const paddingY = r + 10;
          
          if (node.x < paddingX) { node.x = paddingX; node.vx = 0; }
          if (node.x > 800 - paddingX) { node.x = 800 - paddingX; node.vx = 0; }
          if (node.y < paddingY) { node.y = paddingY; node.vy = 0; }
          if (node.y > 480 - paddingY) { node.y = 480 - paddingY; node.vy = 0; }
        });
        
        return nodes;
      });
      
      animationId = requestAnimationFrame(tick);
    };
    
    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [activeTab, graphViewMode, navigationEdges, draggedNodeId, graphNodes.length, visitedNodes]);

  // SVG Mouse handlers for dragging
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
          return { ...n, x, y, vx: 0, vy: 0 };
        }
        return n;
      });
    });
  };

  const handleSVGMouseUpOrLeave = () => {
    setDraggedNodeId(null);
  };

  return {
    graphNodes,
    draggedNodeId,
    handleSVGMouseDown,
    handleSVGMouseMove,
    handleSVGMouseUpOrLeave
  };
};
