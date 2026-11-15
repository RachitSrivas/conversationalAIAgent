'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Sparkles, User, Clock } from 'lucide-react';
import { SearchToolCall } from './SearchToolCall';
import { formatTemporalContext } from '@/lib/memory/temporal-resolver';

interface MessageItemProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    createdAt?: string | Date;
    toolInvocations?: any[];
    annotations?: any[];
  };
}

export function MessageItem({ message }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = message.createdAt
    ? formatTemporalContext(
        typeof message.createdAt === 'string'
          ? message.createdAt
          : message.createdAt.toISOString()
      )
    : null;

  // Extract tool invocations from native toolInvocations or stream annotations
  const annotationsList = Array.isArray(message.annotations) ? message.annotations : [];
  const searchAnnotations = annotationsList
    .filter((a: any) => a?.type === 'search_results')
    .map((a: any) => ({
      toolName: 'web_search',
      args: a.args || { query: a.query },
      state: a.state || 'result',
      result: a.result,
    }));

  const allToolInvocations = [
    ...(message.toolInvocations || []),
    ...searchAnnotations,
  ];

  return (
    <div
      className={`group relative flex gap-3.5 py-4 px-4 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-[#121215]/60 border-y border-[#1e1e22]'
      }`}
    >
      {/* Avatar Icon */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-7 h-7 rounded-full bg-[#27272a] flex items-center justify-center text-zinc-300">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Header: Name & Timestamp */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-200">
              {isUser ? 'You' : 'Minimy Agent'}
            </span>
            {formattedTime && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-500 font-normal">
                <Clock className="w-2.5 h-2.5" />
                {formattedTime}
              </span>
            )}
          </div>

          <button
            onClick={copyToClipboard}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Render Web Search Tool Invocations */}
        {allToolInvocations.length > 0 && (
          <div className="space-y-1 my-2">
            {allToolInvocations.map((inv: any, idx: number) => (
              <SearchToolCall key={inv.toolCallId || idx} toolInvocation={inv} />
            ))}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <div className="prose prose-invert max-w-none text-sm text-zinc-200 leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 underline font-medium"
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
