import { useState, useEffect, useCallback } from 'react';
import { TabPanel } from './components/TabPanel';
import { ChatTab } from './components/tabs/ChatTab';
import { SummaryTab } from './components/tabs/SummaryTab';
import { CitationsTab } from './components/tabs/CitationsTab';
import { AuthorsTab } from './components/tabs/AuthorsTab';
import { FactCheckTab } from './components/tabs/FactCheckTab';
import { SettingsModal } from './components/SettingsModal';
import { useExtensionStore } from '../stores/extensionStore';
import { WikipediaPage, ChatMessage, Conversation, generateId } from '@wikisense/shared';
import { TabType } from '@wikisense/shared';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
  { id: 'summary', label: 'Summary', icon: <SummaryIcon /> },
  { id: 'citations', label: 'Citations', icon: <CitationsIcon /> },
  { id: 'authors', label: 'Authors', icon: <AuthorsIcon /> },
  { id: 'factcheck', label: 'Fact-Check', icon: <FactCheckIcon /> },
];

function ChatIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
}
function SummaryIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
}
function CitationsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22h8a2 2 0 0 0 2-2V7l-5-5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>;
}
function AuthorsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
}
function FactCheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [page, setPage] = useState<WikipediaPage | null>(null);
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { apiKey, setApiKey } = useExtensionStore();

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
      if (chrome.runtime.lastError) {
        setError('Extension context invalidated. Please reload.');
      }
    });

    const listener = (message: any) => {
      if (message.type === 'PAGE_EXTRACTED') {
        setPage(message.payload);
        if (!conversationId) {
          setConversationId(generateId('conv'));
        }
      } else if (message.type === 'EXTRACTION_ERROR') {
        setError('Failed to extract page content');
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE' });

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!page || !apiKey) return;

    const userMessage: ChatMessage = {
      id: generateId('msg'),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await new Promise<{ success: boolean; data?: string; error?: string }>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: 'CHAT_STREAM',
            payload: { page, messages: [...messages, userMessage], conversationId },
            requestId: generateId('req'),
          },
          (resp) => resolve(resp)
        );
      });

      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          id: generateId('msg'),
          role: 'assistant',
          content: response.data,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        await chrome.runtime.sendMessage({
          type: 'SAVE_CONVERSATION',
          payload: {
            id: conversationId,
            pageId: page.url,
            pageTitle: page.title,
            messages: [...messages, userMessage, assistantMessage],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, messages, conversationId, apiKey]);

  if (!page) {
    return (
      <div className="app loading">
        <div className="loading-content">
          <div className="spinner" />
          <p>Loading Wikipedia article...</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="app no-api-key">
        <div className="empty-state">
          <SettingsIcon className="empty-icon" />
          <h2>Welcome to WikiSense</h2>
          <p>Configure your Google Gemini API key to start chatting with Wikipedia articles.</p>
          <button className="btn-primary" onClick={() => setShowSettings(true)}>Open Settings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <LogoIcon />
            <span>WikiSense</span>
          </div>
          <span className="page-title" title={page.title}>{page.title}</span>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={() => setShowSettings(true)} aria-label="Settings">
            <SettingsIcon />
          </button>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="content" role="tabpanel">
        {activeTab === 'chat' && <ChatTab page={page} messages={messages} onSendMessage={sendMessage} isLoading={isLoading} />}
        {activeTab === 'summary' && <SummaryTab page={page} />}
        {activeTab === 'citations' && <CitationsTab page={page} />}
        {activeTab === 'authors' && <AuthorsTab page={page} />}
        {activeTab === 'factcheck' && <FactCheckTab page={page} />}
      </main>

      {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}

      {showSettings && (
        <SettingsModal
          apiKey={apiKey}
          onSave={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
}

function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="error-toast">
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}