import { useState, useEffect } from 'react';
import { WikipediaPage } from '@wikisense/shared';

type SummaryType = 'quick' | 'detailed' | 'eli5' | 'key-facts' | 'section-by-section';

interface SummaryTabProps {
  page: WikipediaPage;
}

const SUMMARY_TYPES: { value: SummaryType; label: string; description: string }[] = [
  { value: 'quick', label: 'Quick', description: '5-7 bullet points' },
  { value: 'detailed', label: 'Detailed', description: 'Section-by-section' },
  { value: 'eli5', label: 'ELI5', description: 'Simple explanation' },
  { value: 'key-facts', label: 'Key Facts', description: 'Top 10 facts' },
  { value: 'section-by-section', label: 'By Section', description: 'Per section summary' },
];

export function SummaryTab({ page }: SummaryTabProps) {
  const [activeType, setActiveType] = useState<SummaryType>('quick');
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateSummary(activeType);
  }, [activeType, page]);

  const generateSummary = async (type: SummaryType) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await new Promise<{ success: boolean; data?: string; error?: string }>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'SUMMARIZE', payload: { page, type } },
          (resp) => resolve(resp)
        );
      });

      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        throw new Error(response.error || 'Failed to generate summary');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summary-tab">
      <div className="summary-header">
        <h2>Summary</h2>
        <div className="summary-type-selector" role="radiogroup" aria-label="Summary type">
          {SUMMARY_TYPES.map((type) => (
            <button
              key={type.value}
              role="radio"
              aria-checked={activeType === type.value}
              className={`type-btn ${activeType === type.value ? 'active' : ''}`}
              onClick={() => setActiveType(type.value)}
            >
              <span className="type-label">{type.label}</span>
              <span className="type-desc">{type.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="summary-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Generating {SUMMARY_TYPES.find(t => t.value === activeType)?.label.toLowerCase()} summary...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <ErrorIcon />
            <p>Failed to generate summary</p>
            <button className="btn-secondary" onClick={() => generateSummary(activeType)}>Retry</button>
          </div>
        ) : (
          <div className="summary-text" dangerouslySetInnerHTML={{ __html: formatSummary(summary) }} />
        )}
      </div>

      <div className="summary-actions">
        <button className="btn-secondary" onClick={() => copySummary()}>
          <CopyIcon /> Copy
        </button>
        <button className="btn-secondary" onClick={() => shareSummary()}>
          <ShareIcon /> Share
        </button>
      </div>
    </div>
  );
}

function formatSummary(text: string): string {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\d+\.\s(.*)/gm, '<li>$1</li>')
    .replace(/^-\s(.*)/gm, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function copySummary() {
  navigator.clipboard.writeText(summary);
}

function shareSummary() {
  if (navigator.share) {
    navigator.share({ title: page.title, text: summary });
  }
}

function ErrorIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
}
function CopyIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
}
function ShareIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;
}