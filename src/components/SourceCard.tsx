'use client';

import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { SearchSource } from '@/lib/memory/types';

interface SourceCardProps {
  source: SearchSource;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  const hostname = source.domain || (source.url ? new URL(source.url).hostname : 'source');

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col justify-between p-2.5 rounded-lg border border-[#27272a] bg-[#141416] hover:bg-[#1c1c1f] hover:border-[#3f3f46] transition-all text-xs"
    >
      <div className="flex items-center gap-1.5 text-[#a1a1aa] mb-1">
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#27272a] text-[10px] text-zinc-300 font-mono">
          {index}
        </span>
        <Globe className="w-3 h-3 text-emerald-400" />
        <span className="truncate max-w-[120px] font-medium">{hostname}</span>
        <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
      </div>
      <p className="font-medium text-zinc-200 line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">
        {source.title}
      </p>
    </a>
  );
}
