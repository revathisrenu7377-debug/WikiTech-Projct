import { useState, useEffect } from 'react';
import { useExtensionStore } from '../../stores/extensionStore';

interface SettingsModalProps {
  apiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export function SettingsModal({ apiKey, onSave, onClose }: SettingsModalProps) {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { settings, updateSettings } = useExtensionStore();

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const handleSave = async () => {
    if (!inputKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(inputKey.trim());
      setMessage({ type: 'success', text: 'API key saved successfully!' });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save API key' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestKey = async () => {
    if (!inputKey.trim()) return;
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${inputKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Test' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: 'API key is valid!' });
      } else {
        setMessage({ type: 'error', text: 'Invalid API key' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to test API key' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <section className="settings-section">
            <h3>Google Gemini API Key</h3>
            <p className="settings-desc">
              Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>.
              Your key is stored locally and never sent anywhere except to Google's API.
            </p>

            <div className="input-group">
              <label htmlFor="api-key" className="sr-only">API Key</label>
              <div className="input-wrapper">
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <LoadingSpinner size="sm" /> : 'Save API Key'}
              </button>
              <button className="btn-secondary" onClick={handleTestKey} disabled={isSaving || !inputKey.trim()}>
                Test Key
              </button>
            </div>

            {message && (
              <div className={`settings-message ${message.type}`}>
                {message.text}
              </div>
            )}
          </section>

          <section className="settings-section">
            <h3>Model & Behavior</h3>
            <div className="setting-row">
              <label htmlFor="model">Model</label>
              <select
                id="model"
                value={settings.model}
                onChange={(e) => updateSettings({ model: e.target.value as any })}
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Best Quality)</option>
                <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
              </select>
            </div>
            <div className="setting-row">
              <label htmlFor="temperature">Temperature</label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
              />
              <span>{settings.temperature.toFixed(1)}</span>
            </div>
            <div className="setting-row checkbox-row">
              <input
                id="auto-summarize"
                type="checkbox"
                checked={settings.autoSummarize}
                onChange={(e) => updateSettings({ autoSummarize: e.target.checked })}
              />
              <label htmlFor="auto-summarize">Auto-generate summary on page load</label>
            </div>
          </section>

          <section className="settings-section">
            <h3>Appearance</h3>
            <div className="setting-row">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value as any })}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 16, md: 24, lg: 32 };
  return <div className={`spinner ${className || ''}`} style={{ width: sizes[size], height: sizes[size] }} />;
}

function CloseIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}
function EyeIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
}
function EyeOffIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;
}