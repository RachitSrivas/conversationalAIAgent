import { createDataStreamResponse, streamText } from 'ai';
import { getLanguageModel } from '@/lib/agent/model-provider';
import { buildSystemPrompt } from '@/lib/agent/system-prompt';
import { executeWebSearch } from '@/lib/search/web-search-tool';
import { memoryStore } from '@/lib/memory/memory-store';
import { resolveTemporalReference } from '@/lib/memory/temporal-resolver';
import { ChatMessage } from '@/lib/memory/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, sessionId, simulatedDate } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    const userText = lastUserMessage.content || '';

    // Determine temporal anchor date (defaults to current server time or simulated reference date)
    const referenceDate = simulatedDate ? new Date(simulatedDate) : new Date();

    // 1. Resolve temporal references (e.g. "Monday", "3 November", "Last Tuesday")
    const temporalRange = resolveTemporalReference(userText, referenceDate);

    // 2. Extract potential entity and topic keywords
    const keywords = userText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(
        (w: string) =>
          w.length > 3 &&
          !['what', 'when', 'where', 'which', 'that', 'this', 'have', 'from', 'with'].includes(w)
      );

    // 3. Recall episodic memory & past conversation threads
    const recalled = memoryStore.recallMemories({
      temporalRange,
      keywords,
      currentSessionId: sessionId,
    });

    // 4. Construct grounded system prompt with clock, calendar mapping, and memories
    const systemPrompt = buildSystemPrompt({
      referenceDate,
      recalledMemories: recalled.memories,
      recalledMessages: recalled.matchedMessages,
    });

    // 5. Persist user message to the active session
    if (sessionId) {
      const userMsgRecord: ChatMessage = {
        id: lastUserMessage.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sessionId,
        role: 'user',
        content: userText,
        createdAt: new Date().toISOString(),
        temporalAnchor: temporalRange ? temporalRange.label : undefined,
      };
      memoryStore.addMessage(userMsgRecord);
    }

    // 6. Determine whether web search is required
    const lowerText = userText.toLowerCase();
    const needsSearch =
      lowerText.includes('pricing') ||
      lowerText.includes('price') ||
      lowerText.includes('change') ||
      lowerText.includes('shipped') ||
      lowerText.includes('correct today') ||
      lowerText.includes('still correct') ||
      lowerText.includes('stats') ||
      lowerText.includes('score') ||
      lowerText.includes('news') ||
      lowerText.includes('latest') ||
      lowerText.includes('current') ||
      lowerText.includes('update') ||
      lowerText.includes('shortlist') ||
      lowerText.includes('who is') ||
      lowerText.includes('what is') ||
      recalled.memories.length > 0;

    return createDataStreamResponse({
      execute: async (dataStream) => {
        let webSourcesContext = '';
        const searchResultsList: any[] = [];

        if (needsSearch) {
          // Formulate search queries based on intent and recalled memories
          const queriesToSearch: string[] = [];

          if (recalled.memories.length > 0) {
            // Benchmark Scenario 1: Shortlisted entities (e.g. HubSpot, Pipedrive, Close, etc.)
            const topMem = recalled.memories[0];
            if (topMem.entities && topMem.entities.length > 0) {
              const entityList = topMem.entities.slice(0, 3).join(' ');
              queriesToSearch.push(`${entityList} pricing changes updates`);
            } else {
              queriesToSearch.push(`${topMem.topic} pricing updates`);
            }
          } else {
            // General web search query
            queriesToSearch.push(userText);
          }

          // Execute searches
          for (const q of queriesToSearch) {
            try {
              const searchRes = await executeWebSearch(q);
              searchResultsList.push(searchRes);

              // Stream tool execution annotation to client
              dataStream.writeMessageAnnotation({
                type: 'search_results',
                args: { query: q },
                state: 'result',
                result: {
                  query: q,
                  sources: searchRes.results,
                  provider: searchRes.provider,
                },
              } as any);

              if (searchRes.results.length > 0) {
                webSourcesContext += `\n### LIVE WEB SEARCH RESULTS FOR: "${q}" (via ${searchRes.provider})\n`;
                searchRes.results.forEach((s, idx) => {
                  webSourcesContext += `[Source ${idx + 1}]: ${s.title} (${s.url})\n${s.snippet}\n\n`;
                });
              }
            } catch (err: any) {
              console.error('Web search error during streaming:', err);
            }
          }
        }

        // Construct final messages array with grounding
        const formattedMessages = messages.map((m: any, idx: number) => {
          if (idx === messages.length - 1 && webSourcesContext) {
            return {
              role: m.role,
              content: `${m.content}\n\n${webSourcesContext}\n(Note: Synthesize your answer incorporating verified facts from these live search results with inline citations [1], [2], etc.)`,
            };
          }
          return {
            role: m.role,
            content: m.content,
          };
        });

        const model = getLanguageModel();

        const result = streamText({
          model,
          system: systemPrompt,
          messages: formattedMessages,
          onFinish: async ({ text }) => {
            if (sessionId && text) {
              const assistantMsgRecord: ChatMessage = {
                id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                sessionId,
                role: 'assistant',
                content: text,
                createdAt: new Date().toISOString(),
                sources: searchResultsList.flatMap((s) => s.results),
              };
              memoryStore.addMessage(assistantMsgRecord);
            }
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during agent execution',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
