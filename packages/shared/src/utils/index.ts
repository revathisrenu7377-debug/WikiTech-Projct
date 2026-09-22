import { WikipediaPage, Section, Citation, Author, InfoboxField } from '../types';

export function generateId(prefix = 'ws'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\\[\d+\\]/g, '')
    .replace(/\\n+/g, '\n')
    .trim();
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export function getCitationType(citation: Citation): Citation['type'] {
  if (citation.doi) return 'journal';
  if (citation.isbn) return 'book';
  const domain = extractDomain(citation.url || '');
  if (domain.includes('news') || domain.includes('nytimes') || domain.includes('bbc') || domain.includes('reuters') || domain.includes('apnews') || domain.includes('guardian')) {
    return 'news';
  }
  if (citation.url) return 'web';
  return 'other';
}

export function formatCitation(citation: Citation): string {
  const parts: string[] = [];
  if (citation.text) parts.push(citation.text);
  if (citation.url) parts.push(`URL: ${citation.url}`);
  if (citation.doi) parts.push(`DOI: ${citation.doi}`);
  if (citation.isbn) parts.push(`ISBN: ${citation.isbn}`);
  return parts.join(' | ');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

export function groupCitationsBySection(sections: Section[]): Map<string, Citation[]> {
  const map = new Map<string, Citation[]>();
  for (const section of sections) {
    map.set(section.heading, section.citations);
  }
  return map;
}

export function findCitationById(citations: Citation[], id: string): Citation | undefined {
  return citations.find(c => c.id === id);
}

export function extractWikidataIdFromUrl(url: string): string | null {
  const match = url.match(/[Qq](\d+)/);
  return match ? `Q${match[1]}` : null;
}

export function isWikipediaUrl(url: string): boolean {
  return /^https?:\/\/(?:[a-z]{2,3}\.)?wikipedia\.org\/wiki\//.test(url);
}

export function getArticleTitleFromUrl(url: string): string | null {
  const match = url.match(/\/wiki\/([^#?]+)/);
  return match ? decodeURIComponent(match[1].replace(/_/g, ' ')) : null;
}

export function getLanguageFromUrl(url: string): string {
  const match = url.match(/^https?:\/\/([a-z]{2,3})\.wikipedia\.org/);
  return match ? match[1] : 'en';
}

export function buildPageContext(page: WikipediaPage, maxChars = 100000): string {
  const parts: string[] = [
    `Title: ${page.title}`,
    `URL: ${page.url}`,
    `Language: ${page.language}`,
    '',
    '=== LEAD ===' ,
    page.leadText,
    '',
    '=== INFBOX ===',
    Object.entries(page.infobox).map(([k, v]) => `${k}: ${v}`).join('\n'),
    '',
    '=== SECTIONS ===',
  ];

  let currentLength = parts.join('\n').length;

  for (const section of page.sections) {
    const sectionText = `## ${section.heading}\n${section.content}`;
    if (currentLength + sectionText.length > maxChars) {
      parts.push(`\n[... ${page.sections.length - parts.length + 2} more sections truncated ...]`);
      break;
    }
    parts.push(sectionText);
    currentLength += sectionText.length;
  }

  if (page.citations.length > 0) {
    parts.push('', '=== CITATIONS ===');
    for (const citation of page.citations.slice(0, 50)) {
      parts.push(`[${citation.id}] ${formatCitation(citation)}`);
    }
    if (page.citations.length > 50) {
      parts.push(`[... ${page.citations.length - 50} more citations ...]`);
    }
  }

  return parts.join('\n');
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function splitIntoChunks(text: string, maxTokens: number): string[] {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      const lastPeriod = text.lastIndexOf('. ', end);
      const breakPoint = Math.max(lastNewline, lastPeriod);
      if (breakPoint > start + maxChars * 0.5) {
        end = breakPoint + 1;
      }
    }
    chunks.push(text.slice(start, end));
    start = end;
  }

  return chunks;
}