import fs from 'fs';
import path from 'path';
import { ChatSession, ChatMessage, EpisodicMemory } from './types';
import { generateBenchmarkSeedData } from '../fixtures/benchmark-data';
import { ResolvedDateRange } from './temporal-resolver';

const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const MEMORIES_FILE = path.join(DATA_DIR, 'memories.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonAtomic<T>(filePath: string, data: T): void {
  try {
    ensureDataDir();
    const tempPath = `${filePath}.tmp-${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export class MemoryStore {
  private static instance: MemoryStore;

  private constructor() {
    this.init();
  }

  public static getInstance(): MemoryStore {
    if (!MemoryStore.instance) {
      MemoryStore.instance = new MemoryStore();
    }
    return MemoryStore.instance;
  }

  private init(): void {
    ensureDataDir();
    const sessions = readJson<ChatSession[]>(SESSIONS_FILE, []);
    // If no sessions exist yet, automatically seed the benchmark test cases!
    if (sessions.length === 0) {
      this.seedBenchmark();
    }
  }

  public seedBenchmark(referenceDate?: Date): void {
    const seed = generateBenchmarkSeedData(referenceDate || new Date());
    writeJsonAtomic(SESSIONS_FILE, seed.sessions);
    writeJsonAtomic(MESSAGES_FILE, seed.messages);
    writeJsonAtomic(MEMORIES_FILE, seed.memories);
  }

  // Session Operations
  public getSessions(): ChatSession[] {
    return readJson<ChatSession[]>(SESSIONS_FILE, []).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getSession(id: string): ChatSession | null {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === id) || null;
  }

  public createSession(title: string = 'New Conversation'): ChatSession {
    const sessions = this.getSessions();
    const now = new Date().toISOString();
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      preview: 'Start a new conversation...',
    };
    sessions.unshift(newSession);
    writeJsonAtomic(SESSIONS_FILE, sessions);
    return newSession;
  }

  public deleteSession(id: string): boolean {
    let sessions = this.getSessions();
    sessions = sessions.filter((s) => s.id !== id);
    writeJsonAtomic(SESSIONS_FILE, sessions);

    // Delete associated messages
    let messages = readJson<ChatMessage[]>(MESSAGES_FILE, []);
    messages = messages.filter((m) => m.sessionId !== id);
    writeJsonAtomic(MESSAGES_FILE, messages);

    // Delete associated episodic memories
    let memories = readJson<EpisodicMemory[]>(MEMORIES_FILE, []);
    memories = memories.filter((mem) => mem.sessionId !== id);
    writeJsonAtomic(MEMORIES_FILE, memories);

    return true;
  }

  // Message Operations
  public getMessages(sessionId: string): ChatMessage[] {
    const all = readJson<ChatMessage[]>(MESSAGES_FILE, []);
    return all
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addMessage(message: ChatMessage): void {
    const all = readJson<ChatMessage[]>(MESSAGES_FILE, []);
    all.push(message);
    writeJsonAtomic(MESSAGES_FILE, all);

    // Update session updatedAt and count
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === message.sessionId);
    if (session) {
      session.updatedAt = message.createdAt;
      session.messageCount = (session.messageCount || 0) + 1;
      if (message.role === 'user' && (!session.preview || session.preview === 'Start a new conversation...')) {
        session.preview = message.content.substring(0, 100);
        if (session.title === 'New Conversation') {
          session.title = message.content.substring(0, 40) + (message.content.length > 40 ? '...' : '');
        }
      }
      writeJsonAtomic(SESSIONS_FILE, sessions);
    }
  }

  // Episodic Memory & Cross-Session Recall
  public recallMemories(options: {
    temporalRange?: ResolvedDateRange | null;
    keywords?: string[];
    currentSessionId?: string;
  }): {
    memories: EpisodicMemory[];
    matchedMessages: ChatMessage[];
  } {
    const memories = readJson<EpisodicMemory[]>(MEMORIES_FILE, []);
    const messages = readJson<ChatMessage[]>(MESSAGES_FILE, []);

    const matchedMemories: EpisodicMemory[] = [];
    const matchedMessages: ChatMessage[] = [];

    const { temporalRange, keywords } = options;

    // 1. If temporal range is given (e.g. "On Monday", "3 November", "Last Tuesday")
    if (temporalRange) {
      const startMs = temporalRange.startDate.getTime();
      const endMs = temporalRange.endDate.getTime();

      for (const mem of memories) {
        const memDate = new Date(mem.date).getTime();
        // Check date match with 24h flexibility
        if (memDate >= startMs - 86400000 && memDate <= endMs + 86400000) {
          matchedMemories.push(mem);
        }
      }

      for (const msg of messages) {
        const msgDate = new Date(msg.createdAt).getTime();
        if (msgDate >= startMs - 86400000 && msgDate <= endMs + 86400000) {
          matchedMessages.push(msg);
        }
      }
    }

    // 2. Keyword & entity matching if keywords provided
    if (keywords && keywords.length > 0) {
      const lowerKeys = keywords.map((k) => k.toLowerCase());

      for (const mem of memories) {
        if (!matchedMemories.some((m) => m.id === mem.id)) {
          const content = `${mem.topic} ${mem.entities.join(' ')} ${mem.summary} ${mem.rawMessageSnippet}`.toLowerCase();
          const matches = lowerKeys.some((k) => content.includes(k));
          if (matches) {
            matchedMemories.push(mem);
          }
        }
      }

      for (const msg of messages) {
        if (!matchedMessages.some((m) => m.id === msg.id)) {
          const lowerMsg = msg.content.toLowerCase();
          const matches = lowerKeys.some((k) => lowerMsg.includes(k));
          if (matches) {
            matchedMessages.push(msg);
          }
        }
      }
    }

    return {
      memories: matchedMemories,
      matchedMessages: matchedMessages.slice(0, 8), // Keep relevant context compact
    };
  }
}

export const memoryStore = MemoryStore.getInstance();
