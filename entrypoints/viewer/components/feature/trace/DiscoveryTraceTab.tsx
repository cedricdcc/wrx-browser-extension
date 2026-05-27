import { Link2, ChevronRight } from 'lucide-react';
import { UrnTrace } from '../../../hooks/useWRXSession';

const STRATEGIES = [
  { id: 'content-negotiation', name: 'Content Negotiation (Accept headers)', step: '1' },
  { id: 'signposting-link-header', name: 'HTTP Link Headers (rel=describedby)', step: '2' },
  { id: 'linkset', name: 'RFC 9264 Linksets', step: '3' },
  { id: 'signposting-html-link', name: 'HTML Link Tags', step: '4' },
  { id: 'embedded-script', name: 'Embedded JSON-LD / RDF Scripts', step: '5' },
  { id: 'sitemap-signposting', name: 'Sitemap / Robots.txt Crawl', step: '6' }
];

interface DiscoveryTraceTabProps {
  activeTrace: UrnTrace;
  selectedUri: string;
}

export const DiscoveryTraceTab = ({ activeTrace, selectedUri }: DiscoveryTraceTabProps) => {
  return (
    <div className="tab-panel trace-panel">
      <div className="trace-intro">
        <h3>WRX Discovery Strategy Timeline</h3>
        <p>
          Cascading discovery path details for selected URI: **{selectedUri}**
        </p>
      </div>

      <div className="timeline-flow">
        {STRATEGIES.map((strategy) => {
          const isSuccess = activeTrace.source === strategy.id;
          const hasExecuted =
            activeTrace.source !== 'N/A' &&
            STRATEGIES.findIndex((s) => s.id === activeTrace.source) >=
              STRATEGIES.findIndex((s) => s.id === strategy.id);

          let stateClass = 'skipped';
          let statusText = 'Skipped';

          if (isSuccess) {
            stateClass = 'success';
            statusText = 'Discovered RDF here!';
          } else if (hasExecuted) {
            stateClass = 'attempted';
            statusText = 'Tried (No RDF found)';
          }

          return (
            <div key={strategy.id} className={`timeline-node ${stateClass}`}>
              <div className="step-badge">{strategy.step}</div>
              <div className="timeline-content">
                <h4>{strategy.name}</h4>
                <span className="timeline-status-badge">{statusText}</span>
                {isSuccess && (
                  <div className="success-details">
                    <p>Successfully extracted semantic triples using this pipeline.</p>
                    <div className="details-pill-box">
                      <span>MIME Resolved: {activeTrace.format}</span>
                      <span>Chars Fetched: {activeTrace.content?.length.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activeTrace.linkRelations && activeTrace.linkRelations.length > 0 && (
          <div className="timeline-node success relations-node">
            <div className="step-badge">
              <Link2 size={14} />
            </div>
            <div className="timeline-content">
              <h4>Extend-Link Capabilities (Web-Link Relations)</h4>
              <span className="timeline-status-badge">Active</span>
              <div className="success-details">
                <p>
                  Extracted {activeTrace.linkRelations.length} active web-link relations via signposting
                  and merged them as structured triples in the Knowledge Graph view.
                </p>
                <div className="relations-list">
                  {activeTrace.linkRelations.map((rel, i) => (
                    <div key={i} className="relation-item">
                      <ChevronRight size={10} className="timeline-arrow" />
                      <span className="rel-tag">{rel.rel}</span>
                      <span className="rel-href">{rel.href}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
