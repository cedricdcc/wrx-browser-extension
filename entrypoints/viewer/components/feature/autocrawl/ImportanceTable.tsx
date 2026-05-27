import { useState } from 'react';
import { Compass } from 'lucide-react';
import { AutocrawlNode } from '../../../hooks/useAutocrawl';

interface ImportanceTableProps {
  nodes: AutocrawlNode[];
}

export const ImportanceTable = ({ nodes }: ImportanceTableProps) => {
  const [showFormulaExplanation, setShowFormulaExplanation] = useState(false);

  return (
    <div className="table-wrapper autocrawl-importance-table flex-col" style={{ gap: '1rem' }}>
      
      {/* Mathematical Exposition Dropdown */}
      <div className="glass-card animate-fadeIn" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.01)' }}>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} 
          onClick={() => setShowFormulaExplanation(!showFormulaExplanation)}
        >
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            <Compass size={16} style={{ color: 'var(--accent-purple)' }} />
            How Personalized PageRank Centrality is Calculated
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
            {showFormulaExplanation ? 'Hide Mathematical Details [-]' : 'Show Mathematical Details [+]'}
          </span>
        </div>

        {showFormulaExplanation && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Standard PageRank evaluates structural importance globally, allowing huge semantic sinks (such as high-level RDF/SHACL type nodes) to absorb infinite rank. To prevent this, STITCH utilizes <strong>Personalized PageRank (PPR)</strong>. Sinks and damping factor redistributions are personalized strictly to your exploration seed.
            </p>

            {/* Mathematically Typeset Equation Box */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.35)', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              margin: '8px 0',
              fontFamily: 'Cambria, Georgia, serif',
              fontSize: '18px',
              color: '#ffffff',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
            }}>
              <div style={{ textAlign: 'center', lineHeight: '1.6' }}>
                PR(u) = (1 - d) &middot; P(u) + d &middot; 
                <span style={{ fontSize: '24px', verticalAlign: 'middle', fontFamily: 'serif', padding: '0 4px' }}>&sum;</span>
                <sub style={{ fontSize: '10px', verticalAlign: 'bottom', marginLeft: '-15px' }}>v &in; B<sub>u</sub></sub> 
                <span style={{ display: 'inline-block', textAlign: 'center', verticalAlign: 'middle', marginLeft: '6px' }}>
                  <span style={{ display: 'block', borderBottom: '1px solid #fff', padding: '0 4px', fontSize: '13px', fontFamily: 'serif', fontWeight: 'bold' }}>PR(v)</span>
                  <span style={{ display: 'block', fontSize: '13px', fontFamily: 'serif', fontWeight: 'bold' }}>L(v)</span>
                </span>
              </div>
            </div>

            {/* Variable Legends Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <div style={{ background: 'rgba(255,255,255,0.015)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>PR(u)</strong>: Centrality weight solved for resource <code className="font-mono" style={{ fontSize: '11px' }}>u</code>.
              </div>
              <div style={{ background: 'rgba(255,255,255,0.015)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--accent-purple)' }}>d = 0.85</strong>: Damping factor representing continuation probability.
              </div>
              <div style={{ background: 'rgba(255,255,255,0.015)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>P(u)</strong>: Personalization vector. Initialized to <code className="font-mono" style={{ fontSize: '11px' }}>1.0</code> for the seed URL and <code className="font-mono" style={{ fontSize: '11px' }}>0.0</code> elsewhere.
              </div>
              <div style={{ background: 'rgba(255,255,255,0.015)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--accent-purple)' }}>B_u</strong>: The set of incoming hyperlink or RDF relationship edges pointing to <code className="font-mono" style={{ fontSize: '11px' }}>u</code>.
              </div>
              <div style={{ background: 'rgba(255,255,255,0.015)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>L(v)</strong>: Outbound links from resource <code className="font-mono" style={{ fontSize: '11px' }}>v</code>. Sinks redistribute authority back to the seed.
              </div>
            </div>
          </div>
        )}
      </div>

      <table className="triples-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>Rank</th>
            <th>Resource URI</th>
            <th style={{ width: '120px' }}>Depth Discovered</th>
            <th style={{ width: '120px' }}>PageRank Score</th>
            <th style={{ width: '100px' }}>Inbound (In)</th>
            <th style={{ width: '100px' }}>Outbound (Out)</th>
            <th style={{ width: '100px' }}>Type</th>
            <th style={{ width: '100px' }}>RDF Harvested</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node, index) => {
            const shortUrl = node.id.replace('https://', '').replace('http://', '');
            return (
              <tr key={node.id} className={index < 5 ? 'top-central-node' : ''}>
                <td className="rank-col">
                  <span className={`rank-badge ${index < 3 ? 'rank-' + (index + 1) : ''}`}>
                    #{index + 1}
                  </span>
                </td>
                <td className="subject-col font-mono" title={node.id}>
                  {shortUrl}
                </td>
                <td className="depth-col text-glow-cyan font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                  {node.depth === 0 ? 'Seed (#0)' : `#${node.depth}`}
                </td>
                <td className="pagerank-col font-semibold text-glow-purple">
                  {(node.pageRank * 100).toFixed(4)}%
                </td>
                <td className="in-degree-col">
                  {node.inDegree} links
                </td>
                <td className="out-degree-col">
                  {node.outDegree} links
                </td>
                <td className="type-col">
                  <span className={`node-badge ${node.type === 'semantic' ? 'predicate' : 'literal'}`}>
                    {node.type.toUpperCase()}
                  </span>
                </td>
                <td className="harvested-col">
                  <span className={`stat-value badge ${node.harvested ? 'content-negotiation' : 'none'}`}>
                    {node.harvested ? 'Harvested' : 'Pending'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
