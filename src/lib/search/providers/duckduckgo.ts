import { SearchSource, SearchToolResult } from '../../memory/types';

/**
 * Fallback search provider requiring no API key.
 * Queries DuckDuckGo HTML interface to parse real-time results.
 */
export async function searchDuckDuckGo(
  query: string,
  options?: { maxResults?: number }
): Promise<SearchToolResult> {
  const maxResults = options?.maxResults || 5;

  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) {
      throw new Error(`DuckDuckGo request returned status ${res.status}`);
    }

    const html = await res.text();
    const results: SearchSource[] = [];

    // Parse snippet blocks from DuckDuckGo HTML
    // DuckDuckGo HTML format:
    // <a class="result__snippet" ...>snippet</a>
    // <a class="result__url" href="...">url</a>
    // <a class="result__title" ...>title</a>
    const resultBlockRegex = /<div class="result\s+results_links[^"]*">([\s\S]*?)<\/div>/gi;
    let match;

    while ((match = resultBlockRegex.exec(html)) !== null && results.length < maxResults) {
      const block = match[1];

      // Extract title & link
      const titleMatch = block.match(/<a class="result__title"[^>]*>([\s\S]*?)<\/a>/i) ||
                         block.match(/<a class="result__a"[^>]*>([\s\S]*?)<\/a>/i);
      const urlMatch = block.match(/href="([^"]+)"/i);
      const snippetMatch = block.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);

      if (titleMatch && urlMatch) {
        let cleanUrl = urlMatch[1];
        // DuckDuckGo redirects through /l/?kh=-1&uddg=...
        if (cleanUrl.includes('uddg=')) {
          const uddgMatch = cleanUrl.match(/uddg=([^&]+)/);
          if (uddgMatch) {
            cleanUrl = decodeURIComponent(uddgMatch[1]);
          }
        }

        const rawTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        const rawSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        if (cleanUrl.startsWith('http')) {
          let domain = '';
          try {
            domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
          } catch {
            domain = cleanUrl;
          }

          results.push({
            title: rawTitle || domain,
            url: cleanUrl,
            snippet: rawSnippet,
            domain,
          });
        }
      }
    }

    return {
      query,
      results: results.slice(0, maxResults),
      searchedAt: new Date().toISOString(),
      provider: 'duckduckgo',
    };
  } catch (err: any) {
    console.error('DuckDuckGo search error:', err);
    return {
      query,
      results: [
        {
          title: `Search Query: ${query}`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: `Live search attempted for query: "${query}". Ensure a search API key (Tavily or Brave) is configured in .env for deeper web indexes.`,
          domain: 'duckduckgo.com',
        },
      ],
      searchedAt: new Date().toISOString(),
      provider: 'duckduckgo',
    };
  }
}
