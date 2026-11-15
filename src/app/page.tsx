'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SessionSidebar } from '@/components/SessionSidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { ChatSession } from '@/lib/memory/types';

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [simulatedDate, setSimulatedDate] = useState<string>('');
  const [pendingPrompt, setPendingPrompt] = useState<string>('');

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
        // Default to first session if none selected
        if (!activeSessionId && data.sessions.length > 0) {
          setActiveSessionId(data.sessions[0].id);
          setActiveSession(data.sessions[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  }, [activeSessionId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const found = sessions.find((s) => s.id === id) || null;
    setActiveSession(found);
  };

  const handleNewSession = async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      const data = await res.json();
      if (data.session) {
        setSessions((prev) => [data.session, ...prev]);
        setActiveSessionId(data.session.id);
        setActiveSession(data.session);
      }
    } catch (err) {
      console.error('Error creating new session:', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          setActiveSession(remaining[0]);
        } else {
          setActiveSessionId(null);
          setActiveSession(null);
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleResetBenchmark = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        setActiveSessionId(data.sessions[0].id);
        setActiveSession(data.sessions[0]);
      }
    } catch (err) {
      console.error('Error resetting benchmark fixtures:', err);
    }
  };

  const handleQuickBenchmarkPrompt = (prompt: string) => {
    // If the prompt relates to Monday CRM, switch to a new or appropriate chat and load prompt
    setPendingPrompt(prompt);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0d0e]">
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onResetBenchmark={handleResetBenchmark}
        onQuickBenchmarkPrompt={handleQuickBenchmarkPrompt}
        simulatedDate={simulatedDate}
      />

      <main className="flex-1 h-full overflow-hidden flex flex-col">
        <ChatInterface
          session={activeSession}
          simulatedDate={simulatedDate}
          onSessionUpdated={fetchSessions}
          initialPrompt={pendingPrompt}
          onClearInitialPrompt={() => setPendingPrompt('')}
        />
      </main>
    </div>
  );
}
