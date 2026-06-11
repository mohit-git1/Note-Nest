'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FolderOpen, Calendar, Clock, ArrowRight, RotateCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatQuery = searchParams.get('q');
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated') {
      const localSessions = JSON.parse(localStorage.getItem('guest_sessions') || '[]');
      setSessions(localSessions);
      setIsLoading(false);
      return;
    }

    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => {
        setSessions(data.sessions || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [status]);

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-12 pb-4 flex items-center justify-between flex-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
            <FolderOpen className="w-5 h-5 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f2e4a]">Library & Memories</h1>
        </div>
        <div className="flex items-center gap-2 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-sky-100 shadow-sm">
          <Sparkles className="w-3 h-3" />
          <span>{sessions.length} Memories</span>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto px-5 pb-32 custom-scrollbar">
        {chatQuery && (
          <div className="mb-6 p-4 bg-sky-50 border border-sky-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-[10px] text-sky-600 font-bold uppercase tracking-widest mb-1">Searching memories for</p>
            <p className="text-[#0f2e4a] font-semibold">"{chatQuery}"</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
             <RotateCw className="w-6 h-6 animate-spin text-sky-600" />
             <p className="text-xs font-bold tracking-widest uppercase">Fetching Memories...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-[#0f2e4a]">No memories yet</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-[200px] mx-auto">Your recorded notes and meeting transcripts will appear here.</p>
            <button 
              onClick={() => router.push('/meeting')}
              className="mt-6 px-6 py-2.5 bg-[#0f2e4a] text-white rounded-full text-sm font-bold shadow-md hover:bg-[#1a3f61] transition-all"
            >
              Record First Note
            </button>
          </div>
        ) : (
          <div className="grid gap-4 mt-2">
            {sessions.map(session => (
              <div 
                key={session.sessionId} 
                onClick={() => router.push(`/meeting?sessionId=${session.sessionId}`)}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-[#0f2e4a] group-hover:text-sky-600 transition-colors">
                      {session.title || 'Untitled Meeting'}
                    </h3>
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="flex items-center gap-1 text-[11px] font-medium">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.startedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-full text-slate-300 group-hover:text-sky-500 group-hover:bg-sky-50 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium pr-4">
                  {session.preview || 'No transcript available for this session.'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                   <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-100">
                     Transcript
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Floating CTA */}
      <div className="absolute bottom-6 left-0 right-0 px-5 pointer-events-none">
        <button 
          onClick={() => router.push('/meeting')}
          className="pointer-events-auto flex items-center justify-center gap-2 w-full py-4 bg-[#0f2e4a] hover:bg-[#1a3f61] text-white rounded-full text-[15px] font-bold transition-colors shadow-lg shadow-[#0f2e4a]/20"
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
          Capture New Memory
        </button>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading library...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
