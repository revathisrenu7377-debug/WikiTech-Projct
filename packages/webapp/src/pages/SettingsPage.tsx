import { useState } from 'react';
import { useExtensionStore } from '@wikisense/shared';

export function SettingsPage() {
  const { apiKey, setApiKey, settings, updateSettings } = useExtensionStore();
  const [inputKey, setInputKey] = useState(apiKey);

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <div className="settings-section">
        <h2>Google Gemini API Key</h2>
        <p>Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a></p>
        <div className="input-group">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Enter API key"
          />
          <button className="btn-primary" onClick={() => setApiKey(inputKey)}>Save</button>
        </div>
      </div>
      <div className="settings-section">
        <h2>Model</h2>
        <select value={settings.model} onChange={(e) => updateSettings({ model: e.target.value as any })}>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
        </select>
      </div>
    </div>
  );
}