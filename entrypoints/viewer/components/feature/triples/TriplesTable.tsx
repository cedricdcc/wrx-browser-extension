import { Quad } from 'n3';

interface TriplesTableProps {
  filteredTriples: Quad[];
  selectedUri: string;
  onNodeClick: (uri: string, relationLabel?: string) => void;
}

export const TriplesTable = ({
  filteredTriples,
  selectedUri,
  onNodeClick
}: TriplesTableProps) => {
  return (
    <div className="table-wrapper">
      <table className="triples-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Predicate</th>
            <th>Object</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {filteredTriples.map((t, idx) => (
            <tr key={idx}>
              <td className="subject-col">
                <button
                  onClick={() => onNodeClick(t.subject.value)}
                  className={`node-btn subject ${t.subject.termType === 'BlankNode' ? 'blank' : ''}`}
                  title={`Subject (${t.subject.termType}): ${t.subject.value}`}
                >
                  {t.subject.termType === 'BlankNode' ? 'blank:' : ''}
                  {t.subject.value.replace(selectedUri, './')}
                </button>
              </td>
              <td className="predicate-col">
                <span className="node-badge predicate" title={t.predicate.value}>
                  {t.predicate.value.split('#').pop()?.split('/').pop()}
                </span>
              </td>
              <td className="object-col">
                {t.object.termType === 'Literal' ? (
                  <span className="node-badge literal" title={`Literal: ${t.object.value}`}>
                    "{t.object.value}"
                  </span>
                ) : (
                  <button
                    onClick={() => onNodeClick(t.object.value, t.predicate.value)}
                    className={`node-btn object ${t.object.termType === 'BlankNode' ? 'blank' : ''}`}
                    title={`Object (${t.object.termType}): ${t.object.value}`}
                  >
                    {t.object.termType === 'BlankNode' ? 'blank:' : ''}
                    {t.object.value.startsWith('http')
                      ? t.object.value.replace(selectedUri, './')
                      : t.object.value}
                  </button>
                )}
              </td>
              <td className="source-col">
                <button
                  onClick={() => onNodeClick(t.graph.value)}
                  className="node-btn source-badge"
                  title={`Retrieved from: ${t.graph.value}`}
                >
                  {t.graph.value.replace('https://', '').replace('http://', '').slice(0, 20)}
                  {t.graph.value.length > 20 ? '...' : ''}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
