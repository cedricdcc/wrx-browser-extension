interface HierarchicalTreeProps {
  visitedNodes: any[];
  navigationEdges: any[];
  selectedUri: string;
  onSelectNode: (uri: string) => void;
}

export const HierarchicalTree = ({
  visitedNodes,
  navigationEdges,
  selectedUri,
  onSelectNode
}: HierarchicalTreeProps) => {
  const renderTreeListNode = (nodeId: string, depth: number = 0): React.ReactNode => {
    const outgoing = navigationEdges.filter(e => e.source === nodeId);
    const nodeName = nodeId.replace('https://', '').replace('http://', '');
    const isSelected = nodeId === selectedUri;
    
    return (
      <div key={nodeId} className="tree-list-item" style={{ paddingLeft: `${depth * 1.5}rem` }}>
        <div className="tree-list-node-row">
          <div className="tree-list-connector-line"></div>
          <button
            onClick={() => onSelectNode(nodeId)}
            className={`tree-list-node-btn ${isSelected ? 'selected' : ''}`}
            title={nodeId}
          >
            <span className="tree-list-node-bullet"></span>
            <span className="tree-list-node-label">{nodeName}</span>
          </button>
        </div>
        
        {outgoing.map((edge, idx) => {
          const targetNode = visitedNodes.find(n => n.id === edge.target);
          if (!targetNode) return null;
          
          return (
            <div key={idx} className="tree-list-relation-branch">
              <div className="tree-list-relation-row" style={{ paddingLeft: `${(depth * 1.5) + 0.75}rem` }}>
                <span className="tree-list-relation-tag">
                  ↳ {edge.label.split('#').pop()?.split('/').pop()}
                </span>
              </div>
              {renderTreeListNode(edge.target, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  if (visitedNodes.length === 0) {
    return <p className="no-data-text">No navigation history harvested yet.</p>;
  }
  
  const roots = visitedNodes.filter(node => {
    return !navigationEdges.some(edge => edge.target === node.id);
  });
  
  const finalRoots = roots.length > 0 ? roots : [visitedNodes[0]];
  
  return (
    <div className="hierarchical-tree-container">
      {finalRoots.map(root => renderTreeListNode(root.id, 0))}
    </div>
  );
};
