import { GeminiClient, createGeminiClient } from '@wikisense/shared';
import { WikipediaPage, ChatMessage, Citation, Conversation, Summary, FactCheckResult, generateId } from '@wikisense/shared';

interface BackgroundMessage {
  type: string;
  payload?: any;
  requestId?: string;
}

interface ApiKeyMessage extends BackgroundMessage {
  type: 'SET_API_KEY' | 'GET_API_KEY';
  payload?: { apiKey: string };
}

interface ChatMessage extends BackgroundMessage {
  type: 'CHAT' | 'CHAT_STREAM';
  payload: {
    page: WikipediaPage;
    messages: ChatMessage[];
    conversationId: string;
  };
}

interface SummarizeMessage extends BackgroundMessage {
  type: 'SUMMARIZE';
  payload: {
    page: WikipediaPage;
    type: 'quick' | 'detailed' | 'eli5' | 'key-facts' | 'section-by-section';
  };
}

interface FactCheckMessage extends BackgroundMessage {
  type: 'FACT_CHECK';
  payload: {
    page: WikipediaPage;
    claims: string[];
  };
}

interface IdentifyAuthorsMessage extends BackgroundMessage {
  type: 'IDENTIFY_AUTHORS';
  payload: { page: WikipediaPage };
}

interface StorageMessage extends BackgroundMessage {
  type: 'SAVE_CONVERSATION' | 'GET_CONVERSATIONS' | 'DELETE_CONVERSATION' | 'SAVE_SUMMARY' | 'GET_SUMMARIES' | 'SAVE_FACT_CHECK' | 'GET_FACT_CHECK';
  payload?: any;
}

type AnyMessage = BackgroundMessage | ApiKeyMessage | ChatMessage | SummarizeMessage | FactCheckMessage | IdentifyAuthorsMessage | StorageMessage;

const STORAGE_KEYS = {
  API_KEY: 'wikisense_api_key',
  CONVERSATIONS: 'wikisense_conversations',
  SUMMARIES: 'wikisense_summaries',
  FACT_CHECKS: 'wikisense_fact_checks',
  SETTINGS: 'wikisense_settings',
} as const;

let geminiClient: GeminiClient | null = null;
const pendingRequests = new Map<string, (response: any) => void>();

async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
  return result[STORAGE_KEYS.API_KEY] || null;
}

async function setApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: apiKey });
  geminiClient = createGeminiClient(apiKey);
}

function getClient(): GeminiClient | null {
  return geminiClient;
}

async function initializeClient(): Promise<void> {
  const apiKey = await getApiKey();
  if (apiKey) {
    geminiClient = createGeminiClient(apiKey);
  }
}

async function handleChat(message: ChatMessage, sendResponse: (response: any) => void): Promise<void> {
  const client = getClient();
  if (!client) {
    sendResponse({ success: false, error: 'API key not configured' });
    return;
  }

  const { page, messages, conversationId } = message.payload;

  try {
    if (message.type === 'CHAT_STREAM') {
      const stream = client.streamChat(page, messages);
      for await (const chunk of stream) {
        sendResponse({ success: true, streaming: true, chunk });
      }
      sendResponse({ success: true, streaming: false, done: true });
    } else {
      const lastMessage = messages[messages.length - 1];
      const response = await client.generateContent(lastMessage.content, client['config'].systemPrompt);
      sendResponse({ success: true, data: response });
    }
  } catch (error) {
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleSummarize(message: SummarizeMessage, sendResponse: (response: any) => void): Promise<void> {
  const client = getClient();
  if (!client) {
    sendResponse({ success: false, error: 'API key not configured' });
    return;
  }

  try {
    const summary = await client.summarize(message.payload.page, message.payload.type);
    sendResponse({ success: true, data: summary });
  } catch (error) {
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleFactCheck(message: FactCheckMessage, sendResponse: (response: any) => void): Promise<void> {
  const client = getClient();
  if (!client) {
    sendResponse({ success: false, error: 'API key not configured' });
    return;
  }

  try {
    const result = await client.factCheck(message.payload.page, message.payload.claims);
    sendResponse({ success: true, data: result });
  } catch (error) {
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleIdentifyAuthors(message: IdentifyAuthorsMessage, sendResponse: (response: any) => void): Promise<void> {
  const client = getClient();
  if (!client) {
    sendResponse({ success: false, error: 'API key not configured' });
    return;
  }

  try {
    const result = await client.identifyAuthors(message.payload.page);
    sendResponse({ success: true, data: result });
  } catch (error) {
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleStorage(message: StorageMessage, sendResponse: (response: any) => void): Promise<void> {
  try {
    switch (message.type) {
      case 'SAVE_CONVERSATION': {
        const conv = message.payload as Conversation;
        const conversations = await getConversations();
        const existing = conversations.findIndex(c => c.id === conv.id);
        if (existing >= 0) conversations[existing] = conv;
        else conversations.unshift(conv);
        await chrome.storage.local.set({ [STORAGE_KEYS.CONVERSATIONS]: conversations.slice(0, 50) });
        sendResponse({ success: true });
        break;
      }
      case 'GET_CONVERSATIONS': {
        const conversations = await getConversations();
        sendResponse({ success: true, data: conversations });
        break;
      }
      case 'DELETE_CONVERSATION': {
        const conversations = await getConversations();
        const filtered = conversations.filter(c => c.id !== message.payload);
        await chrome.storage.local.set({ [STORAGE_KEYS.CONVERSATIONS]: filtered });
        sendResponse({ success: true });
        break;
      }
      case 'SAVE_SUMMARY': {
        const summary = message.payload as Summary;
        const summaries = await getSummaries();
        const existing = summaries.findIndex(s => s.id === summary.id);
        if (existing >= 0) summaries[existing] = summary;
        else summaries.unshift(summary);
        await chrome.storage.local.set({ [STORAGE_KEYS.SUMMARIES]: summaries.slice(0, 100) });
        sendResponse({ success: true });
        break;
      }
      case 'GET_SUMMARIES': {
        const summaries = await getSummaries();
        sendResponse({ success: true, data: summaries });
        break;
      }
      case 'SAVE_FACT_CHECK': {
        const factCheck = message.payload as FactCheckResult;
        const factChecks = await getFactChecks();
        factChecks.unshift(factCheck);
        await chrome.storage.local.set({ [STORAGE_KEYS.FACT_CHECKS]: factChecks.slice(0, 50) });
        sendResponse({ success: true });
        break;
      }
      case 'GET_FACT_CHECK': {
        const factChecks = await getFactChecks();
        sendResponse({ success: true, data: factChecks });
        break;
      }
      default:
        sendResponse({ success: false, error: 'Unknown storage operation' });
    }
  } catch (error) {
    sendResponse({ success: false, error: String(error) });
  }
}

async function getConversations(): Promise<Conversation[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CONVERSATIONS);
  return result[STORAGE_KEYS.CONVERSATIONS] || [];
}

async function getSummaries(): Promise<Summary[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SUMMARIES);
  return result[STORAGE_KEYS.SUMMARIES] || [];
}

async function getFactChecks(): Promise<FactCheckResult[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.FACT_CHECKS);
  return result[STORAGE_KEYS.FACT_CHECKS] || [];
}

chrome.runtime.onMessage.addListener((message: AnyMessage, sender, sendResponse) => {
  const requestId = message.requestId || generateId();

  switch (message.type) {
    case 'SET_API_KEY':
      setApiKey(message.payload!.apiKey).then(() => sendResponse({ success: true }));
      return true;

    case 'GET_API_KEY':
      getApiKey().then(key => sendResponse({ success: true, data: key }));
      return true;

    case 'CHAT':
    case 'CHAT_STREAM':
      handleChat(message, sendResponse);
      return true;

    case 'SUMMARIZE':
      handleSummarize(message, sendResponse);
      return true;

    case 'FACT_CHECK':
      handleFactCheck(message, sendResponse);
      return true;

    case 'IDENTIFY_AUTHORS':
      handleIdentifyAuthors(message, sendResponse);
      return true;

    case 'SAVE_CONVERSATION':
    case 'GET_CONVERSATIONS':
    case 'DELETE_CONVERSATION':
    case 'SAVE_SUMMARY':
    case 'GET_SUMMARIES':
    case 'SAVE_FACT_CHECK':
    case 'GET_FACT_CHECK':
      handleStorage(message, sendResponse);
      return true;

    case 'PING':
      sendResponse({ success: true, data: 'pong' });
      return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  initializeClient();
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('wikipedia.org/wiki/')) {
    chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html',
      enabled: true,
    });
  }
});

initializeClient();