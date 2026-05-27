import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { UrnTrace } from '../../../hooks/useWRXSession';

interface SourceTabProps {
  activeTrace: UrnTrace;
}

export const SourceTab = ({ activeTrace }: SourceTabProps) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopySource = () => {
    if (activeTrace.content) {
      navigator.clipboard.writeText(activeTrace.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tab-panel flex-col">
      <div className="source-controls-bar">
        <span className="source-format-label">
          Format: {activeTrace.format}
        </span>
        <button className="copy-btn" onClick={handleCopySource}>
          {copied ? <Check size={14} className="success-icon" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Source'}
        </button>
      </div>
      <pre className="source-code-block">
        <code>{activeTrace.content || 'Only web links fetched. No direct RDF source available.'}</code>
      </pre>
    </div>
  );
};
