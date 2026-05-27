import { Quad } from 'n3';

interface AnalyticsTabProps {
  triples: Quad[];
}

export const AnalyticsTab = ({ triples }: AnalyticsTabProps) => {
  const getClassDistribution = () => {
    const counts: Record<string, number> = {};
    triples.forEach(t => {
      if (t.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        counts[t.object.value] = (counts[t.object.value] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const getPredicateDistribution = () => {
    const counts: Record<string, number> = {};
    triples.forEach(t => {
      counts[t.predicate.value] = (counts[t.predicate.value] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const getTermTypeRatio = () => {
    let named = 0, literal = 0, blank = 0;
    triples.forEach(t => {
      if (t.object.termType === 'NamedNode') named++;
      else if (t.object.termType === 'Literal') literal++;
      else if (t.object.termType === 'BlankNode') blank++;
    });
    const total = triples.length || 1;
    return {
      named: (named / total) * 100,
      literal: (literal / total) * 100,
      blank: (blank / total) * 100,
      counts: { named, literal, blank }
    };
  };

  const classData = getClassDistribution();
  const predicateData = getPredicateDistribution();
  const ratioData = getTermTypeRatio();

  return (
    <div className="tab-panel flex-col">
      <div className="trace-intro">
        <h3>Accumulated Session Analytics</h3>
        <p>
          Visual frequency graphs and ratio breakdowns of all RDF metadata crawled
          during the current browsing session.
        </p>
      </div>

      <div className="analytics-grid">
        {/* Class Histogram */}
        <div className="chart-card">
          <h4>Class Distribution (rdf:type)</h4>
          {classData.length === 0 ? (
            <p className="no-data-text">No type definitions found in session.</p>
          ) : (
            <div className="histogram-flow">
              {classData.map(([name, count]) => {
                const max = classData[0] ? classData[0][1] : 1;
                const percent = (count / max) * 100;
                return (
                  <div className="histogram-item" key={name}>
                    <span className="histogram-label" title={name}>
                      {name.split('#').pop()?.split('/').pop()}
                    </span>
                    <div className="histogram-bar-wrapper">
                      <div className="histogram-bar" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="histogram-val">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Predicate Histogram */}
        <div className="chart-card">
          <h4>Top 5 Predicates Frequency</h4>
          {predicateData.length === 0 ? (
            <p className="no-data-text">No predicates discovered.</p>
          ) : (
            <div className="histogram-flow">
              {predicateData.map(([name, count]) => {
                const max = predicateData[0] ? predicateData[0][1] : 1;
                const percent = (count / max) * 100;
                return (
                  <div className="histogram-item" key={name}>
                    <span className="histogram-label" title={name}>
                      {name.split('#').pop()?.split('/').pop()}
                    </span>
                    <div className="histogram-bar-wrapper">
                      <div className="histogram-bar purple" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="histogram-val">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ratio bar chart */}
      <div className="ratio-container-card">
        <h4>Knowledge Graph Term Type Proportion</h4>
        <div className="ratio-bar-wrapper">
          <div className="ratio-segment named" style={{ width: `${ratioData.named}%` }} title={`NamedNodes: ${ratioData.counts.named}`}></div>
          <div className="ratio-segment literal" style={{ width: `${ratioData.literal}%` }} title={`Literals: ${ratioData.counts.literal}`}></div>
          <div className="ratio-segment blank" style={{ width: `${ratioData.blank}%` }} title={`BlankNodes: ${ratioData.counts.blank}`}></div>
        </div>
        <div className="ratio-legend">
          <div className="legend-item"><span className="dot named"></span> NamedNode ({Math.round(ratioData.named)}%)</div>
          <div className="legend-item"><span className="dot literal"></span> Literal ({Math.round(ratioData.literal)}%)</div>
          <div className="legend-item"><span className="dot blank"></span> BlankNode ({Math.round(ratioData.blank)}%)</div>
        </div>
      </div>
    </div>
  );
};
