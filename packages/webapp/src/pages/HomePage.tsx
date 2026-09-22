import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export function HomePage() {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const articleTitle = url.split('/wiki/').pop()?.split('#')[0]?.split('?')[0] || url;
    if (articleTitle) {
      navigate(`/wiki/${encodeURIComponent(articleTitle)}`);
    }
  };

  return (
    <div className="home-page">
      <div className="hero">
        <h1>AI-Powered Wikipedia Companion</h1>
        <p>Summarize, chat, fact-check, and explore any Wikipedia article with AI</p>

        <form onSubmit={handleSubmit} className="url-form">
          <div className="input-group">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a Wikipedia URL or search for an article..."
              aria-label="Wikipedia article URL"
            />
            <button type="submit" className="btn-primary">
              Explore
            </button>
          </div>
        </form>

        <div className="features-grid">
          <FeatureCard icon={<ChatBubbleIcon />} title="Chat" description="Ask questions about any article and get AI-powered answers with citations" />
          <FeatureCard icon={<SummaryIcon />} title="Smart Summaries" description="Get quick, detailed, or ELI5 summaries of any Wikipedia article" />
          <FeatureCard icon={<CitationsIcon />} title="Citation Tracking" description="Trace every claim back to its source with full citation details" />
          <FeatureCard icon={<ShieldIcon />} title="Fact-Check" description="Verify claims against article citations and sources" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link to="/" className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </Link>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
}
function SummaryIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
}
function CitationsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22h8a2 2 0 0 0 2-2V7l-5-5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
}
function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
}