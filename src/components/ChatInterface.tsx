'use client';

import React, { useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Send, StopCircle, Sparkles, AlertCircle, ArrowDown } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { ChatSession } from '@/lib/memory/types';

interface ChatInterfaceProps {
  session: ChatSession | null;
  simulatedDate: string;
  onSessionUpdated?: () => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export function ChatInterface({
  session,
  simulatedDate,
  onSessionUpdated,
  initialPrompt,
  onClearInitialPrompt,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
    setInput,
    setMessages,
  } = useChat({
    api: '/api/chat',
    body: {
      sessionId: session?.id,
      simulatedDate: simulatedDate || undefined,
    },
    onFinish: () => {
      if (onSessionUpdated) {
        onSessionUpdated();
      }
    },
  });

  // Handle external prompt injection from sidebar benchmark quick-picks
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt, setInput, onClearInitialPrompt]);

  // Load existing session messages when session changes
  useEffect(() => {
    if (session?.id) {
      fetch(`/api/sessions/${session.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && Array.isArray(data.messages)) {
            setMessages(
              data.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: new Date(m.createdAt),
                toolInvocations: m.toolCalls,
              }))
            );
          }
        })
        .catch((err) => console.error('Failed to load session messages:', err));
    } else {
      setMessages([]);
    }
  }, [session?.id, setMessages]);

  // Auto-scroll on new tokens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const starterQueries = [
    {
      title: 'CRM Pricing Verification',
      text: 'On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?',
    },
    {
      title: 'November 3 Answer Verification',
      text: 'What did I ask you on 3 November? Is your answer still correct today?',
    },
    {
      title: 'Postgres Hosting Diffing',
      text: 'Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0d0e] relative overflow-hidden">
      {/* Top Header */}
      <header className="h-12 border-b border-[#1f1f23] px-6 flex items-center justify-between bg-[#0e0e11]/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-zinc-200">
            {session ? session.title : 'New Research Thread'}
          </span>
          {session?.simulatedDate && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-mono text-[10px]">
              {session.simulatedDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Web Search Tool Active</span>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/20">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                How can Minimy assist your research today?
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Grounds answers in persistent memory across sessions and verifies live facts, pricing,
                and changelogs using real-time web search.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="w-full space-y-2 pt-2 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
                Test with Benchmark Evaluation Queries
              </p>
              {starterQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(q.text)}
                  className="w-full p-3 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-[#1a1a1f] hover:border-emerald-500/40 transition-all text-xs text-zinc-300 hover:text-white flex flex-col gap-0.5 group"
                >
                  <span className="font-medium text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {q.title}
                  </span>
                  <span className="text-zinc-400 text-[11px] line-clamp-1">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#18181b]">
            {messages.map((m) => (
              <MessageItem key={m.id} message={m} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mx-4 mb-2 p-3 rounded-lg border border-red-900/60 bg-red-950/30 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Execution Notice</p>
            <p className="text-[11px] text-red-300/90">{error.message}</p>
            <p className="text-[10px] text-zinc-400">
              Check your <code className="text-zinc-200">.env</code> configuration (OPENAI_API_KEY or TAVILY_API_KEY).
            </p>
          </div>
        </div>
      )}

      {/* Input Box Footer */}
      <div className="p-4 bg-[#0e0e11] border-t border-[#1f1f23]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
              handleSubmit(e);
            }
          }}
          className="max-w-4xl mx-auto relative flex items-center rounded-xl border border-[#2c2c31] bg-[#141418] shadow-sm focus-within:border-emerald-500/70 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything, reference past shortlists, or verify current pricing..."
            className="flex-1 bg-transparent px-4 py-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
            disabled={isLoading}
          />

          <div className="flex items-center gap-1.5 pr-2">
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                className="p-2 rounded-lg bg-[#27272a] hover:bg-[#323238] text-zinc-300 transition-colors"
                title="Stop generation"
              >
                <StopCircle className="w-4 h-4 text-amber-400" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white transition-all active:scale-95"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <div className="max-w-4xl mx-auto flex items-center justify-between text-[11px] text-zinc-500 px-1 pt-2">
          <span>Minimy searches live sources with entity-targeted web queries.</span>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}
