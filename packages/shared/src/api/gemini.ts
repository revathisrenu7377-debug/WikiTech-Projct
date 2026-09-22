import { GeminiConfig, StreamChunk, WikipediaPage, ChatMessage, Citation } from '../types';
import { buildPageContext, estimateTokens } from '../utils';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiClient {
  private config: GeminiConfig;
  private abortController: AbortController | null = null;

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  updateConfig(config: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private buildRequestBody(
    contents: { role: string; parts: { text: string }[] }[],
    stream = true
  ): Record<string, unknown> {
    return {
      contents,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
      ...(stream ? { stream: true } : {}),
    };
  }

  private getUrl(model: string, stream = true): string {
    const action = stream ? 'streamGenerateContent' : 'generateContent';
    return `${GEMINI_BASE_URL}/${model}:${action}?key=${this.config.apiKey}&alt=sse`;
  }

  async *streamChat(
    page: WikipediaPage,
    messages: ChatMessage[],
    systemPrompt?: string
  ): AsyncGenerator<StreamChunk, void, unknown> {
    this.abortController = new AbortController();

    const systemContent = systemPrompt || this.config.systemPrompt;
    const pageContext = buildPageContext(page);

    const contents: { role: string; parts: { text: string }[] }[] = [
      { role: 'user', parts: [{ text: `${systemContent}\n\n=== ARTICLE CONTEXT ===\n${pageContext}` }] },
      { role: 'model', parts: [{ text: 'I understand the article context. How can I help you?' }] },
    ];

    for (const msg of messages.slice(-10)) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const response = await fetch(this.getUrl(this.config.model, true), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buildRequestBody(contents, true)),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                yield { text, done: false };
              }
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { text: '', done: true };
  }

  async generateContent(prompt: string, systemPrompt?: string): Promise<string> {
    const contents = [
      { role: 'user', parts: [{ text: `${systemPrompt || this.config.systemPrompt}\n\n${prompt}` }] },
    ];

    const response = await fetch(this.getUrl(this.config.model, false), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buildRequestBody(contents, false)),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async summarize(
    page: WikipediaPage,
    type: 'quick' | 'detailed' | 'eli5' | 'key-facts' | 'section-by-section'
  ): Promise<string> {
    const prompts: Record<string, string> = {
      quick: 'Summarize this Wikipedia article in 5-7 bullet points. Focus on key facts, dates, figures, and significance. Cite section names in brackets.',
      detailed: 'Provide a comprehensive summary of this article organized by major sections. Include key details, dates, names, and outcomes for each section.',
      eli5: 'Explain this article like I am 5 years old. Use simple language, analogies, and avoid jargon. Keep it engaging and under 300 words.',
      'key-facts': 'Extract the 10 most important facts from this article as a numbered list. Each fact should be verifiable and include a citation reference.',
      'section-by-section': 'Create a section-by-section summary. For each major section, provide 2-3 sentences capturing the essence.',
    };

    const prompt = `${prompts[type]}\n\nReturn only the summary, no meta-commentary.`;
    return this.generateContent(prompt, this.config.systemPrompt);
  }

  async factCheck(
    page: WikipediaPage,
    claims: string[]
  ): Promise<{ claim: string; result: string }[]> {
    const prompt = `Analyze each claim against the article content and citations. For each claim, determine:
1. Is it directly supported by the article?
2. Do the citations actually support it?
3. Are there contradictions in the article?
4. Rate confidence 0-1.

Claims to verify:
${claims.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return JSON array: [{"claim": "...", "status": "verified|partially_supported|contradicted|unverifiable", "confidence": 0.0-1.0, "evidence": "..."}]`;

    const response = await this.generateContent(prompt, this.config.systemPrompt);
    try {
      return JSON.parse(response);
    } catch {
      return claims.map(c => ({ claim: c, result: 'Parse error', confidence: 0, evidence: '' }));
    }
  }

  async identifyAuthors(page: WikipediaPage): Promise<string> {
    const prompt = `Based on the article infobox, Wikidata info, and revision history, identify:
1. The subject creator(s)/author(s)/artist(s) - who created the WORK described in the article
2. Major Wikipedia editors (distinct from subject creators)

Infobox: ${JSON.stringify(page.infobox)}
Authors from extraction: ${page.authors.map(a => `${a.name} (${a.role}, ${a.source})`).join(', ')}

Return JSON: {"subjectCreators": [...], "majorEditors": [...], "notes": "..."}`;

    return this.generateContent(prompt, this.config.systemPrompt);
  }

  abort(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  static createDefault(apiKey: string): GeminiClient {
    return new GeminiClient({
      apiKey,
      model: 'gemini-1.5-flash',
      temperature: 0.3,
      maxTokens: 8192,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    });
  }
}

const DEFAULT_SYSTEM_PROMPT = `You are WikiSense, an AI assistant embedded in Wikipedia. You have access to the full article content, citations, and metadata.

Your role: Help users learn, verify, and explore Wikipedia content.

Guidelines:
- Always cite sources from the article when answering (use section names or citation IDs)
- Distinguish between: article claims, citations, and your analysis
- Flag unverified or controversial claims
- Be concise but thorough
- Admit when information isn't in the article
- Use the provided article context as your primary knowledge source
- If asked about something not in the article, say so clearly
- Format responses with clear structure (bullets, sections, bold for emphasis)`;

export function createGeminiClient(apiKey: string, overrides?: Partial<GeminiConfig>): GeminiClient {
  return new GeminiClient({
    apiKey,
    model: 'gemini-1.5-flash',
    temperature: 0.3,
    maxTokens: 8192,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    ...overrides,
  });
}