import { Search } from 'lucide-react';

export type SelectionRangeId = 'outgoing' | 'incoming' | 'both' | 'harvested' | 'all';

interface TriplesFilterBarProps {
  selectionRange: SelectionRangeId;
  setSelectionRange: (range: SelectionRangeId) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredCount: number;
  focusedCount: number;
  triplesCount: number;
  selectedUri: string;
}

export const TriplesFilterBar = ({
  selectionRange,
  setSelectionRange,
  searchTerm,
  setSearchTerm,
  filteredCount,
  focusedCount,
  triplesCount,
  selectedUri
}: TriplesFilterBarProps) => {
  const shortUri = selectedUri.replace('https://', '').replace('http://', '');

  return (
    <>
      <div className="triples-options-header">
        <div className="filter-range-selector">
          <span className="selector-title">Relation View:</span>
          {(['harvested', 'outgoing', 'incoming', 'both', 'all'] as SelectionRangeId[]).map((range) => (
            <label key={range} className={`radio-label ${selectionRange === range ? 'active' : ''}`}>
              <input
                type="radio"
                name="selectionRange"
                value={range}
                checked={selectionRange === range}
                onChange={() => setSelectionRange(range)}
                className="sr-only"
              />
              <span className="radio-text">
                {range === 'harvested' && 'Retrieved From'}
                {range === 'outgoing' && 'Outgoing'}
                {range === 'incoming' && 'Incoming'}
                {range === 'both' && 'Both'}
                {range === 'all' && 'All Quads'}
              </span>
              <span className="tooltip-text">
                {range === 'harvested' && 'Show triples harvested directly from this URI'}
                {range === 'outgoing' && 'Show properties defined by this URI'}
                {range === 'incoming' && 'Show resources linking to this URI'}
                {range === 'both' && 'Show incoming & outgoing triples'}
                {range === 'all' && 'Show all quads harvested in this session'}
              </span>
            </label>
          ))}
        </div>

        <div className="relation-helper-info">
          {selectionRange === 'harvested' && (
            <p className="relation-desc-text">
              <strong>Retrieved From:</strong> Showing triples harvested directly from the web resource <strong>{shortUri}</strong> during this session.
            </p>
          )}
          {selectionRange === 'all' && (
            <p className="relation-desc-text">
              <strong>All Quads:</strong> Showing the complete accumulated Knowledge Graph harvested during this session. This contains <strong>{triplesCount}</strong> total quads across all crawled URIs.
            </p>
          )}
          {selectionRange === 'outgoing' && (
            <p className="relation-desc-text">
              <strong>Outgoing Properties:</strong> Showing quads where the selected URI is the <em>Subject</em>. These are attributes, types, and links originating from <strong>{shortUri}</strong>.
            </p>
          )}
          {selectionRange === 'incoming' && (
            <p className="relation-desc-text">
              <strong>Incoming Links:</strong> Showing quads where the selected URI is the <em>Object</em>. These show which other resources point to or reference <strong>{shortUri}</strong>.
            </p>
          )}
          {selectionRange === 'both' && (
            <p className="relation-desc-text">
              <strong>Combined View:</strong> Showing all quads involving this URI as either the <em>Subject</em> or the <em>Object</em>. This provides a complete 360-degree look at all connections for <strong>{shortUri}</strong>.
            </p>
          )}
        </div>
      </div>

      <div className="table-filter-bar">
        <Search size={14} className="filter-icon" />
        <input
          type="text"
          className="filter-input"
          placeholder="Filter properties (Subject, Predicate, or Object)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="filter-count">
          Showing {filteredCount} of {focusedCount} triples
        </span>
      </div>
    </>
  );
};
