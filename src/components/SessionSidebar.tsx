'use client';

import React from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle,
} from 'lucide-react';
import { ChatSession } from '@/lib/memory/types';
import { formatTemporalContext } from '@/lib/memory/temporal-resolver';

interface SessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onResetBenchmark: () => void;
  onQuickBenchmarkPrompt: (prompt: string) => void;
  simulatedDate: string;
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onResetBenchmark,
  onQuickBenchmarkPrompt,
  simulatedDate,
}: SessionSidebarProps) {
  const benchmarkPrompts = [
    {
      title: 'CRM Shortlist (Monday)',
      query: 'On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?',
      desc: 'Tests cross-session recall + multi-entity search verification',
    },
    {
      title: '3 November Question',
      query: 'What did I ask you on 3 November? Is your answer still correct today?',
      desc: 'Tests exact date lookup + freshness verification',
    },
    {
      title: 'Postgres Hosting (Last Tuesday)',
      query: 'Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?',
      desc: 'Tests relative weekday resolution + pricing diffing',
    },
  ];

  return (
    <aside className="w-72 sm:w-80 h-full flex flex-col bg-[#0e0e11] border-r border-[#1f1f23] select-none shrink-0">
      {/* Brand & New Chat Header */}
      <div className="p-4 border-b border-[#1f1f23] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                minimy <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">Agent</span>
              </h1>
              <p className="text-[11px] text-zinc-400">Web Search & Episodic Memory</p>
            </div>
          </div>
        </div>

        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-xs font-semibold text-white shadow-sm shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>

      {/* Benchmark Evaluator Quick-Test Shelf */}
      <div className="p-3 border-b border-[#1f1f23] bg-[#121215]/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Evaluation Benchmark
          </span>
          <button
            onClick={onResetBenchmark}
            title="Reload seed benchmark dataset"
            className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 hover:underline"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            Reset
          </button>
        </div>

        <div className="space-y-1.5">
          {benchmarkPrompts.map((b, idx) => (
            <button
              key={idx}
              onClick={() => onQuickBenchmarkPrompt(b.query)}
              className="w-full text-left p-2 rounded-md border border-[#26262b] bg-[#161619] hover:bg-[#1f1f24] hover:border-emerald-500/40 transition-all text-xs group"
            >
              <div className="font-medium text-zinc-200 group-hover:text-emerald-300 flex items-center justify-between">
                <span>{b.title}</span>
                <span className="text-[10px] text-zinc-500 font-mono">Q{idx + 1}</span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">{b.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Session History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
          Conversation History
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500">
            No past conversations yet.
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const timeLabel = formatTemporalContext(session.createdAt);

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all text-xs ${
                  isActive
                    ? 'bg-[#1e1e24] text-white border border-emerald-500/30'
                    : 'text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate leading-snug">{session.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{session.simulatedDate ? `Simulated ${session.simulatedDate}` : timeLabel}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-all shrink-0 ml-1"
                  title="Delete chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Live Agent Clock */}
      <div className="p-3 border-t border-[#1f1f23] bg-[#0c0c0e] text-[11px] text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] text-zinc-300">
            Anchor: {simulatedDate ? simulatedDate : 'Real-time Live'}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">Node TS</span>
      </div>
    </aside>
  );
}
