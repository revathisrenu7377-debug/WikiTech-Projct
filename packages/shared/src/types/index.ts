import { z } from 'zod';

export const CitationSchema = z.object({
  id: z.string(),
  text: z.string(),
  url: z.string().optional(),
  doi: z.string().optional(),
  isbn: z.string().optional(),
  type: z.enum(['web', 'book', 'journal', 'news', 'other']),
  rawHtml: z.string().optional(),
});

export type Citation = z.infer<typeof CitationSchema>;

export const SectionSchema = z.object({
  heading: z.string(),
  level: z.number(),
  content: z.string(),
  citations: z.array(CitationSchema),
  startIndex: z.number(),
  endIndex: z.number(),
});

export type Section = z.infer<typeof SectionSchema>;

export const AuthorSchema = z.object({
  name: z.string(),
  role: z.enum(['author', 'artist', 'creator', 'composer', 'contributor', 'editor']),
  source: z.enum(['infobox', 'wikidata', 'revision_history', 'categories']),
  url: z.string().optional(),
  wikidataId: z.string().optional(),
  description: z.string().optional(),
});

export type Author = z.infer<typeof AuthorSchema>;

export const InfoboxFieldSchema = z.object({
  label: z.string(),
  value: z.string(),
  rawHtml: z.string().optional(),
});

export type InfoboxField = z.infer<typeof InfoboxFieldSchema>;

export const WikipediaPageSchema = z.object({
  title: z.string(),
  url: z.string(),
  wikidataId: z.string().optional(),
  pageId: z.number().optional(),
  revisionId: z.number().optional(),
  language: z.string(),
  leadText: z.string(),
  sections: z.array(SectionSchema),
  infobox: z.record(z.string(), z.string()),
  infoboxFields: z.array(InfoboxFieldSchema),
  citations: z.array(CitationSchema),
  authors: z.array(AuthorSchema),
  categories: z.array(z.string()),
  extractedAt: z.string(),
  contentHash: z.string(),
});

export type WikipediaPage = z.infer<typeof WikipediaPageSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string(),
  citations: z.array(CitationSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  pageTitle: z.string(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const SummarySchema = z.object({
  id: z.string(),
  pageId: z.string(),
  type: z.enum(['quick', 'detailed', 'eli5', 'key-facts', 'section-by-section']),
  content: z.string(),
  sections: z.array(z.string()).optional(),
  createdAt: z.string(),
});

export type Summary = z.infer<typeof SummarySchema>;

export const FactCheckClaimSchema = z.object({
  id: z.string(),
  claim: z.string(),
  sourceSection: z.string().optional(),
  citationIds: z.array(z.string()),
  status: z.enum(['verified', 'partially_supported', 'contradicted', 'unverifiable']),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  verifiedAt: z.string(),
});

export type FactCheckClaim = z.infer<typeof FactCheckClaimSchema>;

export const FactCheckResultSchema = z.object({
  pageId: z.string(),
  claims: z.array(FactCheckClaimSchema),
  overallScore: z.number().min(0).max(1),
  checkedAt: z.string(),
});

export type FactCheckResult = z.infer<typeof FactCheckResultSchema>;

export const SummaryTypeSchema = z.enum(['quick', 'detailed', 'eli5', 'key-facts', 'section-by-section']);
export type SummaryType = z.infer<typeof SummaryTypeSchema>;

export const TabTypeSchema = z.enum(['chat', 'summary', 'citations', 'authors', 'factcheck']);
export type TabType = z.infer<typeof TabTypeSchema>;

export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-1.0-pro';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface ExtractionResult {
  page: WikipediaPage;
  success: boolean;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  streaming?: boolean;
}

export interface StreamChunk {
  text: string;
  done: boolean;
  citations?: Citation[];
}
