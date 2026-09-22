<<<<<<< HEAD
# WikiSense

AI-powered Wikipedia companion that lives inside Wikipedia pages. Summarize, chat, fact-check, and explore citations with AI.

## Features

- **Chat Interface**: Ask questions about any Wikipedia article
- **Smart Summaries**: Quick, detailed, ELI5, key-facts, section-by-section summaries
- **Citation Tracking**: Trace every claim to its source
- **Author Identification**: Find creators and major editors
- **Fact-Checking**: Verify claims against article citations
- **Browser Extension**: Side panel that works on any Wikipedia page
- **Web App**: Companion web application

## Quick Start

```bash
# Install dependencies
npm install

# Set your Google Gemini API key
export GEMINI_API_KEY="your-key-here"

# Build and start all packages
npm run dev
```

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Enter it in the extension's settings panel or web app settings
4. Your key is stored locally in browser storage only

## Browser Extension Installation

1. Build the extension: `npm run build:extension`
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `packages/extension/dist`

## Project Structure

```
wikisense/
├── packages/
│   ├── shared/         # Shared types, utils, API client, prompts
│   ├── extension/      # Browser extension (Manifest V3)
│   └── webapp/         # Web application (React + Vite)
```
=======
# WikiTech
>>>>>>> 4e50de4cc3ad8242e1a98deba04c99a7c7bcbf0f
