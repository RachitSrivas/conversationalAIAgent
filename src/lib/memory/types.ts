export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  domain?: string;
  score?: number;
}

export interface SearchToolResult {
  query: string;
  results: SearchSource[];
  summary?: string;
  searchedAt: string;
  provider: 'tavily' | 'brave' | 'duckduckgo';
}

export interface ToolCallRecord {
  id: string;
  name: 'web_search';
  args: {
    query: string;
    recency?: 'day' | 'week' | 'month' | 'year';
    domains?: string[];
  };
  result?: SearchToolResult;
  status: 'calling' | 'done' | 'error';
  error?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string; // ISO 8601 string
  toolCalls?: ToolCallRecord[];
  sources?: SearchSource[];
  temporalAnchor?: string; // Human label for date context, e.g. "Monday, Nov 10"
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview?: string;
  simulatedDate?: string; // If session represents past conversation
}

export interface EpisodicMemory {
  id: string;
  sessionId: string;
  date: string; // ISO format YYYY-MM-DD
  topic: string;
  entities: string[];
  summary: string;
  keyClaims: string[];
  rawMessageSnippet: string;
}
