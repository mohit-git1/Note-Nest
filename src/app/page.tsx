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

  // Dashboard uses a lighter theme like the reference screenshot
  return (
    <div className="flex flex-col flex-1 w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex flex-col">
          {status === 'authenticated' ? (
            <button onClick={() => signOut()} className="p-2 -ml-2 text-slate-600" title="Sign Out">
              <LogOut className="w-6 h-6" />
            </button>
          ) : (
            <Link href="/signin" className="px-4 py-2 bg-[#0f2e4a] text-white text-sm font-semibold rounded-full hover:bg-[#1a3f61] transition-colors">
              Sign In
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-emerald-100">
          <Sparkles className="w-3 h-3" />
          <span>View Digest</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-32 custom-scrollbar">
        
        {/* Action Banner */}
        {showBanner && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-[28px] leading-tight font-bold text-[#0f2e4a] mb-5 pr-8">
              New action items just dropped to review in your To-Do list <span className="inline-block">🔥</span>
            </h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/todos')}
                className="bg-[#0f2e4a] text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-md hover:bg-[#1a3f61] transition-colors"
              >
                Review
              </button>
              <button 
                onClick={dismissBanner}
                className="bg-white text-[#0f2e4a] px-6 py-2.5 rounded-full text-sm font-semibold shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        )}

        {/* Chat Pill */}
        <form onSubmit={handleChatSubmit} className="mb-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <input 
              type="text" 
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Chat with all your memories" 
              className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 font-medium text-[15px] rounded-full py-4 pl-12 pr-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all group-hover:shadow-md"
            />
          </div>
        </form>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {/* Card 1 */}
          <button 
            onClick={() => router.push('/todos')}
            className="flex flex-col text-left bg-gradient-to-br from-sky-50 to-blue-100 rounded-[20px] p-5 shadow-sm border border-blue-100/50 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-[#0369a1]">
                <CheckSquare className="w-6 h-6" />
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0369a1]/60"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </div>
            <h3 className="text-[17px] font-bold text-slate-800 mb-1">To-Do</h3>
            <div className="flex items-center text-[11px] font-semibold text-slate-500 group-hover:text-[#0369a1] transition-colors">
              <span>View Tasks</span>
              <span className="ml-1 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all">→</span>
            </div>
            {todosCount > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {todosCount}
              </div>
            )}
          </button>

          {/* Card 2 */}
          <button 
            onClick={() => router.push('/library')}
            className="flex flex-col text-left bg-gradient-to-br from-orange-50 to-amber-100 rounded-[20px] p-5 shadow-sm border border-amber-100/50 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-amber-600">
                <FolderOpen className="w-6 h-6" />
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600/60"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 className="text-[17px] font-bold text-slate-800 mb-1">Notes & Chats</h3>
            <div className="flex items-center text-[11px] font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">
              <span>View Memories</span>
              <span className="ml-1 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all">→</span>
            </div>
          </button>
        </div>

        {/* Coming Up / Recent Sessions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-bold text-slate-500">Coming Up</h3>
            <Link href="/library" className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
              view all
            </Link>
          </div>

          <div className="space-y-3">
            {recentMeetings.length === 0 ? (
              <div key="empty-recent" className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-700">No upcoming events found, <br/>manage your calendars</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
              </div>
            ) : (
              recentMeetings.map((session: any, idx: number) => (
                <div key={session._id || `recent-${idx}`} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col gap-1 cursor-pointer hover:border-slate-200 transition-colors" onClick={() => router.push('/library')}>
                  <div className="flex justify-between items-start">
                    <h4 className="text-[15px] font-bold text-slate-800 truncate">{session.title || 'Untitled Meeting'}</h4>
                    <span className="text-[11px] text-slate-400 flex-none">{new Date(session.startedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[13px] text-slate-500 line-clamp-1">
                    {session.transcript?.[0]?.text || 'No transcript available.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Bottom Fixed CTA */}
      <div className="absolute bottom-6 left-0 right-0 px-5 pointer-events-none">
        <button 
          onClick={() => router.push('/meeting')}
          className="pointer-events-auto flex items-center justify-center gap-2 w-full py-4 bg-[#0f2e4a] hover:bg-[#1a3f61] text-white rounded-full text-[15px] font-bold transition-colors shadow-lg shadow-[#0f2e4a]/20"
        >
          <Mic className="w-5 h-5" />
          Record Notes
        </button>
      </div>
    </div>
  );
}
