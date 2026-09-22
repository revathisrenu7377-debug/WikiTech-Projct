import { useRef, useEffect, useState } from 'react';
import { WikipediaPage, ChatMessage, Citation } from '@wikisense/shared';

interface ChatTabProps {
  page: WikipediaPage;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export function ChatTab({ page, messages, onSendMessage, isLoading }: ChatTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputHeight, setInputHeight] = useState(44);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 150);
    setInputHeight(newHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || isLoading) return;

    onSendMessage(content);
    setInputValue('');
    setInputHeight(44);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const suggestedQuestions = [
    'Summarize this article in 3 sentences',
    'What are the key facts and dates?',
    'Who are the main people mentioned?',
    'What controversies are discussed?',
    'Explain this like I\'m 5',
  ];

  return (
    <div className="chat-tab">
      <div className="messages" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-icon">
              <ChatBubbleIcon />
            </div>
            <h3>Start a conversation</h3>
            <p>Ask me anything about <strong>{page.title}</strong></p>
            <div className="suggested-questions">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  className="suggested-btn"
                  onClick={() => onSendMessage(q)}
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask a question..."
            rows={1}
            disabled={isLoading}
            aria-label="Chat input"
            style={{ height: inputHeight }}
          />
        </div>
        <button
          type="submit"
          className="send-btn"
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>
      <div className="message-content">
        <div className="message-text">{formatMessage(message.content)}</div>
        {message.citations && message.citations.length > 0 && (
          <div className="message-citations">
            {message.citations.map((c) => (
              <CitationBadge key={c.id} citation={c} />
            ))}
          </div>
        )}
        <time className="message-time">{formatTime(message.timestamp)}</time>
      </div>
    </div>
  );
}

function CitationBadge({ citation }: { citation: Citation }) {
  return (
    <span className="citation-badge" title={citation.text}>
      [{citation.id.slice(-4)}]
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="message assistant typing">
      <div className="message-avatar"><BotIcon /></div>
      <div className="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  );
}

function formatMessage(content: string): React.ReactNode {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### ')) return <h4 key={i}>{line.slice(4)}</h4>;
    if (line.startsWith('## ')) return <h3 key={i}>{line.slice(3)}</h3>;
    if (line.startsWith('# ')) return <h2 key={i}>{line.slice(2)}</h2>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i}>{line.slice(2)}</li>;
    if (line.match(/^\d+\./)) return <li key={i}>{line}</li>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i}>{parseInlineFormatting(line)}</p>;
  });
}

function parseInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
}
function UserIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
}
function BotIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="17" x2="8.01" y2="17"></line><line x1="12" y1="17" x2="12.01" y2="17"></line><line x1="16" y1="17" x2="16.01" y2="17"></line></svg>;
}
function SendIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
}