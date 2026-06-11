'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { CheckSquare, FolderOpen, Calendar, Mic, Sparkles, LogOut, RotateCw, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();
  
  const [todosCount, setTodosCount] = useState(0);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [chatQuery, setChatQuery] = useState('');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    checkBannerState();
  }, [status]);

  const checkBannerState = () => {
    const lastDismissed = localStorage.getItem('actionBannerDismissed');
    if (!lastDismissed) {
      setShowBanner(true);
      return;
    }
    const dismissedAt = new Date(lastDismissed).getTime();
    const now = new Date().getTime();
    // 24 hours = 86400000 ms
    if (now - dismissedAt > 86400000) {
      setShowBanner(true);
    }
  };

  const dismissBanner = () => {
    localStorage.setItem('actionBannerDismissed', new Date().toISOString());
    setShowBanner(false);
  };

  const fetchDashboardData = async () => {
    if (status !== 'authenticated') {
      const localTodos = JSON.parse(localStorage.getItem('guest_todos') || '[]');
      const incomplete = localTodos.filter((t: any) => !t.completed && !t.done).length;
      setTodosCount(incomplete);
      
      const localSessions = JSON.parse(localStorage.getItem('guest_sessions') || '[]');
      setRecentMeetings(localSessions.slice(0, 3));
      return;
    }

    try {
      // Fetch Todos Count
      const todoRes = await fetch('/api/todos');
      if (todoRes.ok) {
        const { todos } = await todoRes.json();
        const incomplete = todos.filter((t: any) => !t.completed && !t.done).length;
        setTodosCount(incomplete);
      }

      // Fetch Recent Meetings
      const sessionsRes = await fetch('/api/sessions');
      if (sessionsRes.ok) {
        const { sessions } = await sessionsRes.json();
        setRecentMeetings(sessions.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatQuery.trim()) {
      router.push(`/library?chat=true&q=${encodeURIComponent(chatQuery.trim())}`);
    }
  };

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin text-[#0369a1]"><RotateCw className="w-6 h-6" /></div></div>;
  }

  // Minimalist elegant dashboard
  return (
    <div className="flex flex-col flex-1 w-full bg-white text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-10 pb-2">
        <div className="flex items-center">
          {status === 'authenticated' ? (
            <button onClick={() => signOut()} className="text-slate-400 hover:text-slate-600 transition-colors" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <Link href="/signin" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              Sign In
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Digest</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center mt-12 mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl font-light tracking-tight text-slate-800 mb-3">NoteNest</h1>
          <p className="text-slate-400 text-sm font-medium mb-10">Capture thoughts, extract actions.</p>
          
          <button 
            onClick={() => router.push('/meeting')}
            className="group relative flex items-center justify-center gap-2 w-56 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-[15px] font-medium transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 rounded-full bg-slate-900 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <Mic className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Record Note</span>
          </button>
        </div>

        {/* Search / Chat Pill */}
        <form onSubmit={handleChatSubmit} className="max-w-md mx-auto mb-10 animate-in fade-in duration-700 delay-150">
          <div className="relative group">
            <Sparkles className="absolute inset-y-0 left-5 my-auto w-4 h-4 text-slate-300 group-focus-within:text-sky-500 transition-colors" />
            <input 
              type="text" 
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Ask your memories..." 
              className="w-full bg-slate-50 border border-slate-100 text-slate-800 placeholder-slate-400 text-[15px] font-medium rounded-full py-3.5 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/30 transition-all shadow-sm"
            />
          </div>
        </form>

        {/* Quick Links */}
        <div className="flex justify-center gap-3 mb-14 animate-in fade-in duration-700 delay-300">
          <button 
            onClick={() => router.push('/todos')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm rounded-full text-[13px] font-semibold text-slate-600 transition-all"
          >
            <CheckSquare className="w-4 h-4 text-slate-400" />
            To-Do 
            {todosCount > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full ml-0.5">{todosCount}</span>}
          </button>
          <button 
            onClick={() => router.push('/library')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm rounded-full text-[13px] font-semibold text-slate-600 transition-all"
          >
            <FolderOpen className="w-4 h-4 text-slate-400" />
            Library
          </button>
        </div>

        {/* Recent Sessions */}
        <div className="max-w-md mx-auto animate-in fade-in duration-700 delay-500">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent</h3>
            <Link href="/library" className="text-[11px] font-semibold text-sky-500 hover:text-sky-600 transition-colors">
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentMeetings.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50 flex flex-col items-center justify-center gap-2 text-center">
                <Calendar className="w-6 h-6 text-slate-300 mb-1" />
                <span className="text-sm font-medium text-slate-500">No notes yet</span>
                <span className="text-xs text-slate-400">Your recordings will appear here.</span>
              </div>
            ) : (
              recentMeetings.map((session: any, idx: number) => (
                <div 
                  key={session._id || `recent-${idx}`} 
                  className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => router.push('/library')}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="text-[14px] font-semibold text-slate-800 group-hover:text-sky-600 transition-colors truncate pr-4">
                      {session.title || 'Untitled Note'}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap mt-0.5">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                    {session.transcript?.[0]?.text || session.preview || 'No transcript available.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
