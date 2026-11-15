'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, CheckCircle2, Loader2, Globe } from 'lucide-react';
import { SourceCard } from './SourceCard';

interface SearchToolCallProps {
  toolInvocation: any;
}

export function SearchToolCall({ toolInvocation }: SearchToolCallProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toolName, args, state, result } = toolInvocation;

  if (toolName !== 'web_search') {
    return null;
  }

  const query = args?.query || 'Searching the web...';
  const isExecuting = state === 'call';
  const isFinished = state === 'result';
  const sources = result?.sources || [];

  return (
    <div className="my-2.5 rounded-lg border border-[#27272a] bg-[#121214] overflow-hidden text-xs">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[#18181b] transition-colors select-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}

          <div className="flex items-center gap-1.5 truncate">
            <Search className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="text-zinc-400 font-medium">Searched:</span>
            <span className="text-zinc-200 font-mono font-medium truncate">"{query}"</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isFinished && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-[10px] font-mono">
              {sources.length} sources
            </span>
          )}
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="p-3 border-t border-[#27272a] bg-[#0e0e10] space-y-3">
          {sources.length > 0 ? (
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Retrieved Sources
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sources.map((src: any, idx: number) => (
                  <SourceCard key={idx} source={src} index={idx + 1} />
                ))}
              </div>
            </div>
          ) : isExecuting ? (
            <div className="flex items-center gap-2 text-zinc-400 italic py-1">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
              Scanning search index...
            </div>
          ) : (
            <div className="text-zinc-500 py-1">No web sources returned for this query.</div>
          )}
        </div>
      )}
    </div>
  );
}
