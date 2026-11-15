import { tool } from 'ai';
import { z } from 'zod';
import { searchTavily } from './providers/tavily';
import { searchBrave } from './providers/brave';
import { searchDuckDuckGo } from './providers/duckduckgo';
import { SearchToolResult } from '../memory/types';

export async function executeWebSearch(
  query: string,
  options?: { recency?: 'day' | 'week' | 'month' | 'year'; maxResults?: number }
): Promise<SearchToolResult> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const braveKey = process.env.BRAVE_API_KEY;
  const preferredProvider = process.env.SEARCH_PROVIDER?.toLowerCase();

  // 1. Tavily (Preferred for LLM RAG if key present or explicitly selected)
  if ((preferredProvider === 'tavily' || !preferredProvider) && tavilyKey && !tavilyKey.includes('your_')) {
    try {
      return await searchTavily(query, tavilyKey, options);
    } catch (err) {
      console.warn('Tavily search failed, falling back to alternatives...', err);
    }
  }

  // 2. Brave Search if key present
  if (braveKey && !braveKey.includes('your_')) {
    try {
      return await searchBrave(query, braveKey, options);
    } catch (err) {
      console.warn('Brave search failed, falling back to DuckDuckGo...', err);
    }
  }

  // 3. Fallback to DuckDuckGo (Zero configuration needed)
  return await searchDuckDuckGo(query, options);
}

/**
 * AI SDK Tool Definition for Web Search
 */
export const webSearchTool = tool({
  description:
    'Search the live web for up-to-date information, news, current pricing, releases, changelogs, or verification. Use specific, entity-rich search terms.',
  parameters: z.object({
    query: z
      .string()
      .describe(
        'The targeted search query. Formulate precise queries with names, years, and specific topics rather than broad natural language sentences.'
      ),
    recency: z
      .enum(['day', 'week', 'month', 'year'])
      .optional()
      .describe('Filter results by recency if checking for recent changes or updates.'),
  }),
  execute: async ({ query, recency }) => {
    const result = await executeWebSearch(query, { recency });
    
    // Format search results into a compact, clean format for the model
    const formattedResults = result.results.map((r, i) => ({
      index: i + 1,
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      domain: r.domain,
    }));

    return {
      query: result.query,
      resultsCount: result.results.length,
      provider: result.provider,
      sources: formattedResults,
    };
  },
});
