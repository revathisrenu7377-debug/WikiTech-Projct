import { useState, useEffect, useMemo } from 'react';
import { WikipediaPage, Section } from '@wikisense/shared';

interface FactCheckTabProps {
  page: WikipediaPage;
}

export function FactCheckTab({ page }: FactCheckTabProps) {
  const [claims, setClaims] = useState<string[]>([]);
  const [results, setResults] = useState<FactCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customClaim, setCustomClaim] = useState('');

  const extractableClaims = useMemo(() => {
    const claimTexts: string[] = [];
    for (const section of page.sections) {
      const sentences = section.content.split(/[.!?]+/).filter(s => s.trim().length > 30);
      claimTexts.push(...sentences.slice(0, 3));
    }
    return claimTexts.slice(0, 10);
  }, [page.sections]);

  const runFactCheck = async (claimsToCheck: string[]) => {
    if (claimsToCheck.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'FACT_CHECK', payload: { page, claims: claimsToCheck } },
          (resp) => resolve(resp)
        );
      });

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        throw new Error(response.error || 'Fact-check failed');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractClaims = () => {
    setClaims(extractableClaims);
    runFactCheck(extractableClaims);
  };

  const handleCustomClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (customClaim.trim()) {
      const newClaims = [...claims, customClaim.trim()];
      setClaims(newClaims);
      runFactCheck([customClaim.trim()]);
      setCustomClaim('');
    }
  };

  const statusColors = {
    verified: 'var(--success)',
    partially_supported: 'var(--warning)',
    contradicted: 'var(--error)',
    unverifiable: 'var(--text-muted)',
  };

  return (
    <div className="factcheck-tab">
      <div className="factcheck-header">
        <h2>Fact-Check</h2>
        {isLoading && <LoadingSpinner />}
      </div>

      <div className="factcheck-controls">
        <button className="btn-primary" onClick={handleExtractClaims} disabled={isLoading}>
          <SearchIcon /> Extract & Verify Claims
        </button>
        <form onSubmit={handleCustomClaim} className="custom-claim-form">
          <input
            type="text"
            value={customClaim}
            onChange={(e) => setCustomClaim(e.target.value)}
            placeholder="Enter a claim to verify..."
            aria-label="Custom claim"
          />
          <button type="submit" className="btn-secondary" disabled={isLoading || !customClaim.trim()}>
            Verify
          </button>
        </form>
      </div>

      {claims.length === 0 && !isLoading && (
        <div className="empty-state">
          <ShieldIcon className="empty-icon" />
          <h3>No claims checked yet</h3>
          <p>Click "Extract & Verify Claims" to automatically find and verify statements from the article.</p>
        </div>
      )}

      <div className="factcheck-results">
        {results.map((result, i) => (
          <FactCheckCard key={i} result={result} index={i} statusColors={statusColors} />
        ))}
        {claims.length > results.length && (
          <div className="pending-claims">
            {claims.slice(results.length).map((claim, i) => (
              <div key={i} className="pending-claim">
                <span className="pending-text">{claim}</span>
                <LoadingSpinner size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
}

interface FactCheckResult {
  claim: string;
  status: 'verified' | 'partially_supported' | 'contradicted' | 'unverifiable';
  confidence: number;
  evidence: string;
  sourceQuality: string;
}

function FactCheckCard({ result, index, statusColors }: { result: FactCheckResult; index: number; statusColors: Record<string, string> }) {
  const statusColor = statusColors[result.status];

  return (
    <div className="factcheck-card" style={{ borderLeftColor: statusColor }}>
      <div className="factcheck-claim">
        <span className="claim-number">{index + 1}</span>
        <p>{result.claim}</p>
      </div>
      <div className="factcheck-verdict">
        <span
          className="verdict-badge"
          style={{ background: statusColor }}
        >
          {result.status.replace('_', ' ')}
        </span>
        <span className="confidence">Confidence: {Math.round(result.confidence * 100)}%</span>
      </div>
      <div className="factcheck-evidence">
        <strong>Evidence:</strong> {result.evidence}
      </div>
      <div className="factcheck-source-quality">
        <strong>Source Quality:</strong> {result.sourceQuality}
      </div>
    </div>
  );
}

function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 16, md: 24, lg: 32 };
  return <div className={`spinner ${className || ''}`} style={{ width: sizes[size], height: sizes[size] }} />;
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="error-message">
      <AlertIcon />
      <span>{message}</span>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
}
function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
}
function AlertIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
}