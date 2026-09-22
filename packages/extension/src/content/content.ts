interface ExtractionMessage {
  type: 'EXTRACT_PAGE' | 'PAGE_EXTRACTED' | 'EXTRACTION_ERROR' | 'NAVIGATE';
  payload?: any;
}

class WikipediaExtractor {
  private observer: MutationObserver | null = null;
  private lastUrl = '';
  private extractionInProgress = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.isWikipediaArticle()) {
      this.extractAndSend();
      this.observeNavigation();
    }
  }

  private isWikipediaArticle(): boolean {
    return /^https?:\/\/[a-z]{2,3}\.wikipedia\.org\/wiki\/[^:]+$/.test(window.location.href) &&
           !window.location.href.includes('#');
  }

  private observeNavigation(): void {
    this.observer = new MutationObserver(() => {
      if (this.isWikipediaArticle() && window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
        this.extractAndSend();
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('popstate', () => {
      if (this.isWikipediaArticle()) {
        this.extractAndSend();
      }
    });

    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      if (this.isWikipediaArticle()) {
        this.extractAndSend();
      }
    };
  }

  private async extractAndSend(): Promise<void> {
    if (this.extractionInProgress) return;
    this.extractionInProgress = true;

    try {
      const pageData = this.extractPage();
      this.sendMessage({ type: 'PAGE_EXTRACTED', payload: pageData });
    } catch (error) {
      this.sendMessage({ type: 'EXTRACTION_ERROR', payload: { error: String(error) } });
    } finally {
      this.extractionInProgress = false;
    }
  }

  private extractPage(): any {
    const title = this.getTitle();
    const leadText = this.getLeadText();
    const sections = this.getSections();
    const infobox = this.getInfobox();
    const infoboxFields = this.getInfoboxFields();
    const citations = this.getCitations();
    const authors = this.getAuthors(infobox);
    const categories = this.getCategories();
    const wikidataId = this.getWikidataId();
    const pageId = this.getPageId();
    const revisionId = this.getRevisionId();
    const language = this.getLanguage();

    const fullText = [title, leadText, ...sections.map(s => s.content)].join('\n');
    const contentHash = this.hashContent(fullText);

    return {
      title,
      url: window.location.href,
      wikidataId,
      pageId,
      revisionId,
      language,
      leadText,
      sections,
      infobox,
      infoboxFields,
      citations,
      authors,
      categories,
      extractedAt: new Date().toISOString(),
      contentHash,
    };
  }

  private getTitle(): string {
    const h1 = document.querySelector('#firstHeading');
    return h1?.textContent?.trim() || document.title.replace(' - Wikipedia', '');
  }

  private getLeadText(): string {
    const content = document.querySelector('#mw-content-text');
    if (!content) return '';

    const leadParagraphs: string[] = [];
    const parser = new DOMParser();

    for (const child of content.children) {
      if (child.tagName === 'H2') break;
      if (child.tagName === 'P') {
        const text = child.textContent?.trim();
        if (text && text.length > 20) {
          leadParagraphs.push(text);
        }
      }
    }

    return leadParagraphs.join('\n\n');
  }

  private getSections(): any[] {
    const content = document.querySelector('#mw-content-text .mw-parser-output');
    if (!content) return [];

    const sections: any[] = [];
    let currentHeading: HTMLElement | null = null;
    let currentContent: HTMLElement[] = [];
    let startIndex = 0;

    const processSection = (heading: HTMLElement, contentElements: HTMLElement[]) => {
      const headingText = heading.textContent?.replace(/\[\d+\]/g, '').trim() || '';
      const contentText = contentElements
        .map(el => this.cleanElementText(el))
        .filter(t => t.length > 0)
        .join('\n\n');

      if (headingText && contentText) {
        const citations = this.extractCitationsFromElements(contentElements);
        sections.push({
          heading: headingText,
          level: parseInt(heading.tagName[1]),
          content: contentText,
          citations,
          startIndex,
          endIndex: startIndex + contentText.length,
        });
        startIndex += contentText.length;
      }
    };

    for (const child of Array.from(content.children)) {
      if (/^H[2-3]$/.test(child.tagName)) {
        if (currentHeading) {
          processSection(currentHeading, currentContent);
        }
        currentHeading = child as HTMLElement;
        currentContent = [];
      } else if (currentHeading) {
        currentContent.push(child as HTMLElement);
      }
    }

    if (currentHeading) {
      processSection(currentHeading, currentContent);
    }

    return sections;
  }

  private cleanElementText(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.reference, .mw-editsection, .hatnote, .navbox, .infobox, .ambox, .metadata, sup.reference').forEach(el => el.remove());
    return clone.textContent?.replace(/\s+/g, ' ').trim() || '';
  }

  private extractCitationsFromElements(elements: HTMLElement[]): any[] {
    const citations: any[] = [];
    const seen = new Set<string>();

    for (const el of elements) {
      const refs = el.querySelectorAll('sup.reference a, cite, .citation');
      for (const ref of Array.from(refs)) {
        const id = ref.getAttribute('id') || ref.getAttribute('href') || `cite_${Date.now()}_${Math.random()}`;
        if (seen.has(id)) continue;
        seen.add(id);

        const text = ref.textContent?.trim() || '';
        const url = ref.getAttribute('href') || '';
        const doiMatch = text.match(/10\.\d{4,9}\/[-._;()\/:A-Z0-9]+/i);
        const isbnMatch = text.match(/\b(?:ISBN[-:\s]*)?(?:\d{10}|\d{13})\b/i);

        citations.push({
          id,
          text: text.slice(0, 500),
          url: url.startsWith('/') ? `https://en.wikipedia.org${url}` : url,
          doi: doiMatch?.[0],
          isbn: isbnMatch?.[0].replace(/[^\d]/g, ''),
          type: this.getCitationType(text, url),
          rawHtml: ref.outerHTML.slice(0, 1000),
        });
      }
    }

    return citations.slice(0, 100);
  }

  private getCitationType(text: string, url: string): 'web' | 'book' | 'journal' | 'news' | 'other' {
    if (text.includes('DOI') || text.includes('doi:')) return 'journal';
    if (text.includes('ISBN') || text.includes('isbn:')) return 'book';
    const domain = new URL(url).hostname.replace('www.', '');
    const newsDomains = ['nytimes', 'bbc', 'reuters', 'apnews', 'guardian', 'washingtonpost', 'wsj', 'economist'];
    if (newsDomains.some(d => domain.includes(d))) return 'news';
    if (url) return 'web';
    return 'other';
  }

  private getInfobox(): Record<string, string> {
    const infobox: Record<string, string> = {};
    const tables = document.querySelectorAll('.infobox');

    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      for (const row of rows) {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (th && td) {
          const key = th.textContent?.trim().replace(/\[\d+\]/g, '') || '';
          const value = td.textContent?.trim().replace(/\[\d+\]/g, '') || '';
          if (key && value) infobox[key] = value;
        }
      }
    }

    return infobox;
  }

  private getInfoboxFields(): any[] {
    const fields: any[] = [];
    const tables = document.querySelectorAll('.infobox');

    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      for (const row of rows) {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (th && td) {
          fields.push({
            label: th.textContent?.trim().replace(/\[\d+\]/g, '') || '',
            value: td.textContent?.trim().replace(/\[\d+\]/g, '') || '',
            rawHtml: row.outerHTML.slice(0, 500),
          });
        }
      }
    }

    return fields;
  }

  private getCitations(): any[] {
    const citations: any[] = [];
    const seen = new Set<string>();
    const refList = document.querySelector('.reflist, .references');

    if (refList) {
      const items = refList.querySelectorAll('li, .reference');
      for (const item of Array.from(items)) {
        const id = item.getAttribute('id') || `ref_${Date.now()}_${Math.random()}`;
        if (seen.has(id)) continue;
        seen.add(id);

        const text = item.textContent?.trim() || '';
        const link = item.querySelector('a[href]');
        const url = link?.getAttribute('href') || '';
        const doiMatch = text.match(/10\.\d{4,9}\/[-._;()\/:A-Z0-9]+/i);
        const isbnMatch = text.match(/\b(?:ISBN[-:\s]*)?(?:\d{10}|\d{13})\b/i);

        citations.push({
          id,
          text: text.slice(0, 500),
          url: url.startsWith('/') ? `https://en.wikipedia.org${url}` : url,
          doi: doiMatch?.[0],
          isbn: isbnMatch?.[0].replace(/[^\d]/g, ''),
          type: this.getCitationType(text, url),
          rawHtml: item.outerHTML.slice(0, 1000),
        });
      }
    }

    return citations.slice(0, 100);
  }

  private getAuthors(infobox: Record<string, string>): any[] {
    const authors: any[] = [];
    const creatorFields = ['author', 'artist', 'creator', 'composer', 'director', 'producer', 'writer', 'developer', 'designer', 'architect'];

    for (const field of creatorFields) {
      const value = infobox[field] || infobox[field.charAt(0).toUpperCase() + field.slice(1)];
      if (value) {
        authors.push({
          name: value.split(/[,;|]/)[0].trim(),
          role: field as any,
          source: 'infobox',
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(value.split(/[,;|]/)[0].trim().replace(/\s+/g, '_'))}`,
        });
      }
    }

    return authors;
  }

  private getCategories(): string[] {
    const catLinks = document.querySelector('#mw-normal-catlinks');
    if (!catLinks) return [];

    const links = catLinks.querySelectorAll('a');
    return Array.from(links).map(a => a.textContent?.trim() || '').filter(Boolean);
  }

  private getWikidataId(): string | undefined {
    const wikibaseLink = document.querySelector('#t-wikibase a, #wikibase-link a');
    if (wikibaseLink) {
      const href = wikibaseLink.getAttribute('href') || '';
      const match = href.match(/[Qq](\d+)/);
      if (match) return `Q${match[1]}`;
    }

    const script = document.querySelector('script[type="application/ld+json"]');
    if (script) {
      try {
        const data = JSON.parse(script.textContent || '{}');
        if (data['@id']?.includes('wikidata')) {
          const match = data['@id'].match(/[Qq](\d+)/);
          if (match) return `Q${match[1]}`;
        }
      } catch {}
    }

    return undefined;
  }

  private getPageId(): number | undefined {
    const config = (window as any).mw?.config;
    return config?.get?.('wgArticleId');
  }

  private getRevisionId(): number | undefined {
    const config = (window as any).mw?.config;
    return config?.get?.('wgRevisionId');
  }

  private getLanguage(): string {
    const config = (window as any).mw?.config;
    return config?.get?.('wgContentLanguage') || 'en';
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private sendMessage(message: ExtractionMessage): void {
    chrome.runtime.sendMessage(message).catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new WikipediaExtractor());
} else {
  new WikipediaExtractor();
}

chrome.runtime.onMessage.addListener((message: ExtractionMessage) => {
  if (message.type === 'EXTRACT_PAGE') {
    new WikipediaExtractor().extractAndSend();
  }
});