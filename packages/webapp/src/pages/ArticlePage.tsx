import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function ArticlePage() {
  const { articleTitle } = useParams();
  const navigate = useNavigate();
  const [pageUrl, setPageUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const decoded = decodeURIComponent(articleTitle || '');
    setPageUrl(`https://en.wikipedia.org/wiki/${decoded}`);
    setLoading(false);
  }, [articleTitle]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="article-page">
      <div className="article-container">
        <div className="article-frame">
          <iframe
            src={pageUrl}
            title="Wikipedia Article"
            className="wiki-frame"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>

        <div className="assistant-panel">
          <div className="assistant-header">
            <h2>WikiSense</h2>
          </div>
          <div className="assistant-content">
            <p>Ask me anything about this article!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Loading article...</p>
    </div>
  );
}