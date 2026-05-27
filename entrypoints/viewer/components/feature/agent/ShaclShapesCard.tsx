import { Sparkles } from 'lucide-react';

interface ShaclShapesCardProps {
  shaclShapesText: string;
}

export const ShaclShapesCard = ({ shaclShapesText }: ShaclShapesCardProps) => {
  return (
    <div className="shacl-shapes-card glass-card">
      <div className="shacl-card-header">
        <Sparkles size={14} className="text-glow-cyan" />
        <h4>Active SHACL Schema Map</h4>
      </div>
      <p className="shacl-card-desc">Dynamically inferred SHACL shapes directing the LLM agent's SPARQL query paths.</p>
      <pre className="shacl-code-block">
        <code>{shaclShapesText}</code>
      </pre>
    </div>
  );
};
