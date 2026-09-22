import { useState, useMemo } from 'react';
import { WikipediaPage, Citation } from '@wikisense/shared';

interface CitationsTabProps {
  page: WikipediaPage;
}

export function CitationsTab({ page }: CitationsTabProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<Citation['type'] | 'all'>('all');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const filteredCitations = useMemo(() => {
    return page.citations.filter(c => {
      const matchesSearch = !search ||
        c.text.toLowerCase().includes(search.toLowerCase()) ||
        c.url?.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || c.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [page.citations, search, filterType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: page.citations.length };
    for (const c of page.citations) {
      counts[c.type] = (counts[c.type] || 0) + 1;
    }
    return counts;
  }, [page.citations]);

  if (page.citations.length === 0) {
    return (
      <div className="empty-state">
        <BookIcon className="empty-icon" />
        <h3>No citations found</h3>
        <p>This article doesn't have any references to display.</p>
      </div>
    );
  }

  return (
    <div className="citations-tab">
      <div className="citations-header">
        <h2>Citations ({page.citations.length})</h2>
        <div className="citations-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search citations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search citations"
          />
        </div>
      </div>

      <div className="citations-filters">
        {(['all', 'web', 'book', 'journal', 'news', 'other'] as const).map(type => (
          <button
            key={type}
            className={`filter-btn ${filterType === type ? 'active' : ''}`}
            onClick={() => setFilterType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            <span className="filter-count">{typeCounts[type] || 0}</span>
          </button>
        ))}
      </div>

      <div className="citations-list">
        {filteredCitations.map((citation) => (
          <CitationCard
            key={citation.id}
            citation={citation}
            onClick={() => setSelectedCitation(citation)}
          />
        ))}
      </div>

      {selectedCitation && (
        <CitationModal citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
      )}
    </div>
  );
}

function CitationCard({ citation, onClick }: { citation: Citation; onClick: () => void }) {
  const domain = citation.url ? new URL(citation.url).hostname.replace('www.', '') : '';

  return (
    <div className="citation-card" onClick={onClick}>
      <div className="citation-type-badge type-{citation.type}">{citation.type}</div>
      <div className="citation-text">{citation.text}</div>
      {domain && <div className="citation-domain">{domain}</div>}
      {citation.doi && <div className="citation-doi">DOI: {citation.doi}</div>}
      {citation.isbn && <div className="citation-isbn">ISBN: {citation.isbn}</div>}
    </div>
  );
}

function CitationModal({ citation, onClose }: { citation: Citation; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Citation Details</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <div className="citation-detail">
            <label>Text</label>
            <p>{citation.text}</p>
          </div>
          {citation.url && (
            <div className="citation-detail">
              <label>Source URL</label>
              <a href={citation.url} target="_blank" rel="noopener noreferrer">{citation.url}</a>
            </div>
          )}
          {citation.doi && (
            <div className="citation-detail">
              <label>DOI</label>
              <a href={`https://doi.org/${citation.doi}`} target="_blank" rel="noopener noreferrer">{citation.doi}</a>
            </div>
          )}
          {citation.isbn && (
            <div className="citation-detail">
              <label>ISBN</label>
              <span>{citation.isbn}</span>
            </div>
          )}
          <div className="citation-detail">
            <label>Type</label>
            <span className="type-badge type-{citation.type}">{citation.type}</span>
          </div>
        </div>
        <div className="modal-footer">
          {citation.url && (
            <a href={citation.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <ExternalLinkIcon /> Open Source
            </a>
          )}
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
}
function CloseIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}
function BookIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;
}
function ExternalLinkIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;
}