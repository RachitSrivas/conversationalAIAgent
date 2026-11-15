import { streamText } from 'ai';
import { getLanguageModel } from '@/lib/agent/model-provider';
import { buildSystemPrompt } from '@/lib/agent/system-prompt';
import { webSearchTool } from '@/lib/search/web-search-tool';
import { memoryStore } from '@/lib/memory/memory-store';
import { resolveTemporalReference } from '@/lib/memory/temporal-resolver';
import { ChatMessage } from '@/lib/memory/types';

export const maxDuration = 60; // Allow sufficient time for multi-step web search

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

    // 1. Resolve temporal references in the user message (e.g. "Monday", "3 November", "Last Tuesday")
    const temporalRange = resolveTemporalReference(userText, referenceDate);

    // 2. Extract potential entity and topic keywords
    const keywords = userText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !['what', 'when', 'where', 'which', 'that', 'this', 'have', 'from', 'with'].includes(w));

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

    // 6. Execute Agent Loop with Tool Calling & Streaming
    const model = getLanguageModel();

    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      tools: {
        web_search: webSearchTool,
      },
      maxSteps: 5, // Allows autonomous multi-query planning and synthesis
      onFinish: async ({ text, response }) => {
        // Persist assistant message and associated tool calls
        if (sessionId && text) {
          const assistantMsgRecord: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sessionId,
            role: 'assistant',
            content: text,
            createdAt: new Date().toISOString(),
          };
          memoryStore.addMessage(assistantMsgRecord);
        }
      },
    });

    return result.toDataStreamResponse();
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
