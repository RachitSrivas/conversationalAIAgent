import { SearchSource, SearchToolResult } from '../../memory/types';

export async function searchTavily(
  query: string,
  apiKey: string,
  options?: { recency?: string; maxResults?: number }
): Promise<SearchToolResult> {
  const maxResults = options?.maxResults || 5;
  
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_answer: true,
        max_results: maxResults,
        include_domains: [],
        exclude_domains: [],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tavily API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const results: SearchSource[] = (data.results || []).map((item: any) => {
      let domain = '';
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, '');
      } catch {
        domain = item.url;
      }

      return {
        title: item.title || 'Source',
        url: item.url,
        snippet: item.content || item.snippet || '',
        publishedDate: item.published_date,
        domain,
        score: item.score,
      };
    });

    return {
      query,
      results,
      summary: data.answer || undefined,
      searchedAt: new Date().toISOString(),
      provider: 'tavily',
    };
  } catch (err: any) {
    console.error('Tavily search failed:', err);
    throw err;
  }
}
