import { SearchSource, SearchToolResult } from '../../memory/types';

export async function searchBrave(
  query: string,
  apiKey: string,
  options?: { maxResults?: number }
): Promise<SearchToolResult> {
  const maxResults = options?.maxResults || 5;

  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(maxResults));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Brave Search error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const results: SearchSource[] = (data.web?.results || []).map((item: any) => {
      let domain = '';
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, '');
      } catch {
        domain = item.url;
      }

      return {
        title: item.title || 'Source',
        url: item.url,
        snippet: item.description || '',
        publishedDate: item.page_age,
        domain,
      };
    });

    return {
      query,
      results,
      searchedAt: new Date().toISOString(),
      provider: 'brave',
    };
  } catch (err: any) {
    console.error('Brave search failed:', err);
    throw err;
  }
}
