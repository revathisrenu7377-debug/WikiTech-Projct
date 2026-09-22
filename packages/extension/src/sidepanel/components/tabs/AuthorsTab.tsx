import { useState, useEffect } from 'react';
import { WikipediaPage, Author } from '@wikisense/shared';

interface AuthorsTabProps {
  page: WikipediaPage;
}

export function AuthorsTab({ page }: AuthorsTabProps) {
  const [authors, setAuthors] = useState<Author[]>(page.authors);
  const [isLoading, setIsLoading] = useState(false);
  const [enrichedAuthors, setEnrichedAuthors] = useState<Author[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (page.authors.length === 0 && !isLoading) {
      fetchAuthorsFromWikidata();
    } else {
      setEnrichedAuthors(page.authors);
    }
  }, [page]);

  const fetchAuthorsFromWikidata = async () => {
    setIsLoading(true);
    try {
      const response = await new Promise<{ success: boolean; data?: string; error?: string }>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'IDENTIFY_AUTHORS', payload: { page } },
          (resp) => resolve(resp)
        );
      });

      if (response.success && response.data) {
        try {
          const parsed = JSON.parse(response.data);
          const allAuthors: Author[] = [
            ...page.authors,
            ...(parsed.subjectCreators || []).map((a: any) => ({ ...a, source: 'wikidata' as const })),
            ...(parsed.majorEditors || []).map((a: any) => ({ ...a, role: 'editor' as const, source: 'revision_history' as const })),
          ];
          setEnrichedAuthors(allAuthors);
        } catch {
          setEnrichedAuthors(page.authors);
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const groupedAuthors = {
    subjectCreators: enrichedAuthors.filter(a => ['author', 'artist', 'creator', 'composer', 'director', 'producer', 'writer'].includes(a.role)),
    editors: enrichedAuthors.filter(a => a.role === 'editor' || a.source === 'revision_history'),
  };

  if (enrichedAuthors.length === 0 && !isLoading) {
    return (
      <div className="empty-state">
        <UsersIcon className="empty-icon" />
        <h3>No authors identified</h3>
        <p>This article doesn't have clear author/creator information in the infobox.</p>
        <button className="btn-secondary" onClick={fetchAuthorsFromWikidata} disabled={isLoading}>
          Try Wikidata lookup
        </button>
      </div>
    );
  }

  return (
    <div className="authors-tab">
      <div className="authors-header">
        <h2>Authors & Creators</h2>
        {isLoading && <LoadingSpinner />}
      </div>

      {groupedAuthors.subjectCreators.length > 0 && (
        <section className="author-section">
          <h3>Subject Creators</h3>
          <p className="section-desc">People who created the work described in this article</p>
          <div className="author-grid">
            {groupedAuthors.subjectCreators.map(author => (
              <AuthorCard key={author.name} author={author} />
            ))}
          </div>
        </section>
      )}

      {groupedAuthors.editors.length > 0 && (
        <section className="author-section">
          <h3>Major Wikipedia Editors</h3>
          <p className="section-desc">Top contributors to this article</p>
          <div className="author-grid">
            {groupedAuthors.editors.map(author => (
              <AuthorCard key={author.name} author={author} />
            ))}
          </div>
        </section>
      )}

      {error && <ErrorMessage message={error} />}
    </div>
  );
}

function AuthorCard({ author }: { author: Author }) {
  const roleLabels: Record<string, string> = {
    author: 'Author',
    artist: 'Artist',
    creator: 'Creator',
    composer: 'Composer',
    director: 'Director',
    producer: 'Producer',
    writer: 'Writer',
    editor: 'Editor',
    contributor: 'Contributor',
  };

  return (
    <div className="author-card">
      <div className="author-avatar">
        {author.name.charAt(0).toUpperCase()}
      </div>
      <div className="author-info">
        <h4>{author.name}</h4>
        <span className="author-role">{roleLabels[author.role] || author.role}</span>
        <span className="author-source">{author.source}</span>
      </div>
      {author.url && (
        <a href={author.url} target="_blank" rel="noopener noreferrer" className="author-link">
          <ExternalLinkIcon />
        </a>
      )}
    </div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return <div className={`spinner ${className || ''}`} />;
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="error-message">
      <AlertIcon />
      <span>{message}</span>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
}
function ExternalLinkIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;
}
function AlertIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
}