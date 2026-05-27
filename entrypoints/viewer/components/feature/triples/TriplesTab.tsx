import { useState } from 'react';
import { Quad } from 'n3';
import { Network } from 'lucide-react';
import { TriplesFilterBar, SelectionRangeId } from './TriplesFilterBar';
import { TriplesTable } from './TriplesTable';

interface TriplesTabProps {
  triples: Quad[];
  selectedUri: string;
  onNodeClick: (uri: string, relationLabel?: string) => void;
}

export const TriplesTab = ({
  triples,
  selectedUri,
  onNodeClick
}: TriplesTabProps) => {
  const [selectionRange, setSelectionRange] = useState<SelectionRangeId>('harvested');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter triples based on selectedUri and radio selection range
  const focusedTriples = triples.filter((t) => {
    if (selectionRange === 'all') {
      return true;
    }
    if (selectionRange === 'harvested') {
      return t.graph.value === selectedUri;
    }
    if (selectionRange === 'outgoing') {
      return t.subject.value === selectedUri;
    }
    if (selectionRange === 'incoming') {
      return t.object.value === selectedUri;
    }
    return t.subject.value === selectedUri || t.object.value === selectedUri;
  });

  const filteredTriples = focusedTriples.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.subject.value.toLowerCase().includes(term) ||
      t.predicate.value.toLowerCase().includes(term) ||
      t.object.value.toLowerCase().includes(term)
    );
  });

  return (
    <div className="tab-panel flex-col">
      <TriplesFilterBar
        selectionRange={selectionRange}
        setSelectionRange={setSelectionRange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredCount={filteredTriples.length}
        focusedCount={focusedTriples.length}
        triplesCount={triples.length}
        selectedUri={selectedUri}
      />

      {filteredTriples.length === 0 ? (
        <div className="status-panel empty">
          <Network size={48} className="empty-icon" />
          <p>No focused triples found for selection range: {selectionRange}</p>
        </div>
      ) : (
        <TriplesTable
          filteredTriples={filteredTriples}
          selectedUri={selectedUri}
          onNodeClick={onNodeClick}
        />
      )}
    </div>
  );
};
