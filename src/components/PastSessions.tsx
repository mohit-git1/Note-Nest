'use client';

import { useState, useEffect } from 'react';
import { History, X, Loader2, Calendar } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useSession } from 'next-auth/react';

interface SessionPreview {
  sessionId: string;
  startedAt: string;
  preview: string;
}

export function PastSessions() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { loadSession, resetState } = useAppStore();

  const { status } = useSession();

  const fetchSessions = async () => {
    setIsLoading(true);
    if (status !== 'authenticated') {
      const localSessions = JSON.parse(localStorage.getItem('guest_sessions') || '[]');
      setSessions(localSessions);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && status !== 'loading') {
      fetchSessions();
    }
  }, [isOpen, status]);

  const handleLoadSession = async (sessionId: string) => {
    if (sessionId.startsWith('guest_')) {
      const localSessions = JSON.parse(localStorage.getItem('guest_sessions') || '[]');
      const session = localSessions.find((s: any) => s.sessionId === sessionId);
      if (session) {
        loadSession({ ...session, _id: session.sessionId });
        setIsOpen(false);
      }
      return;
    }
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        loadSession(data.session);
        setIsOpen(false);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  };

  const handleNewSession = () => {
    resetState();
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-[#71717a] hover:text-slate-200 hover:bg-[#27272a] rounded-lg transition-all duration-200"
        title="Past Sessions"
      >
        <History className="w-4 h-4" />
        <span className="hidden sm:inline">Sessions</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative z-10 w-full max-w-md max-h-[85vh] mx-4 bg-[#18181b] border border-[#3f3f46] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] flex-none">
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-[#60a5fa]" />
                <h2 className="text-sm font-semibold text-slate-200 tracking-wide">Past Sessions</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNewSession}
                  className="px-3 py-1.5 text-[11px] text-slate-900 bg-[#60a5fa] hover:bg-[#3b82f6] rounded-md transition-colors font-medium"
                >
                  New Session
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[#71717a] hover:text-slate-200 hover:bg-[#27272a] rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#60a5fa]" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-sm text-[#71717a] py-8">No past sessions found.</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => handleLoadSession(session.sessionId)}
                    className="p-4 bg-[#1e1e24] border border-[#3f3f46] rounded-xl hover:border-[#60a5fa]/50 hover:bg-[#27272a] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-xs text-[#a1a1aa] mb-2 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(session.startedAt).toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed group-hover:text-slate-200 transition-colors">
                      {session.preview}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
