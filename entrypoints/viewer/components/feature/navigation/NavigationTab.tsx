import { Quad } from 'n3';
import { SpringGraph } from './SpringGraph';
import { HierarchicalTree } from './HierarchicalTree';

interface NavigationTabProps {
  graphNodes: any[];
  navigationEdges: any[];
  triples: Quad[];
  visitedNodes: any[];
  selectedUri: string;
  onSelectNode: (uri: string) => void;
  onMouseDown: (nodeId: string, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp: () => void;
  graphViewMode: 'spring' | 'treeList';
  setGraphViewMode: (mode: 'spring' | 'treeList') => void;
}

export const NavigationTab = ({
  graphNodes,
  navigationEdges,
  triples,
  visitedNodes,
  selectedUri,
  onSelectNode,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  graphViewMode,
  setGraphViewMode
}: NavigationTabProps) => {
  return (
    <div className="tab-panel flex-col">
      <div className="trace-intro-row">
        <div className="trace-intro">
          <h3>Navigation History Mapping</h3>
          <p>
            Explore all crawled resources in your current semantic session. Toggle between the dynamic physics graph or text tree list.
          </p>
        </div>

        <div className="graph-mode-selector">
          <button
            type="button"
            className={`mode-selector-btn ${graphViewMode === 'spring' ? 'active' : ''}`}
            onClick={() => setGraphViewMode('spring')}
            title="Physics Spring-force directed graph"
          >
            Physics Graph
          </button>
          <button
            type="button"
            className={`mode-selector-btn ${graphViewMode === 'treeList' ? 'active' : ''}`}
            onClick={() => setGraphViewMode('treeList')}
            title="Indented list tree of parent-child relations"
          >
            Hierarchical Tree
          </button>
        </div>
      </div>
      
      {graphViewMode === 'treeList' ? (
        <HierarchicalTree
          visitedNodes={visitedNodes}
          navigationEdges={navigationEdges}
          selectedUri={selectedUri}
          onSelectNode={onSelectNode}
        />
      ) : (
        <SpringGraph
          graphNodes={graphNodes}
          navigationEdges={navigationEdges}
          triples={triples}
          visitedNodes={visitedNodes}
          selectedUri={selectedUri}
          onSelectNode={onSelectNode}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        />
      )}
    </div>
  );
};
