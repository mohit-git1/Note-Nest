'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Home, Mic, FolderOpen, CheckSquare, User, Settings, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { SettingsModal } from './SettingsModal';

export function TopNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't show nav on auth pages
  if (pathname === '/signin' || pathname === '/signup') {
    return null;
  }

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Meeting', href: '/meeting', icon: Mic },
    { name: 'Library', href: '/library', icon: FolderOpen },
    { name: 'To-Do', href: '/todos', icon: CheckSquare },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-1 sm:gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                isActive 
                  ? 'bg-[#0f2e4a] text-white' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
              <span className="hidden sm:inline">{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="flex items-center relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`p-2 rounded-full transition-colors ${
            isDropdownOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-slate-100">
              {status === 'authenticated' ? (
                <>
                  <p className="text-sm font-semibold text-slate-800 truncate">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-800 truncate">Guest User</p>
                  <p className="text-xs text-slate-500 truncate mt-1">Sign in to save notes across devices.</p>
                </>
              )}
            </div>
            
            <div className="p-2 flex flex-col gap-1">
              <SettingsModal triggerClassName="w-full text-left">
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer w-full">
                  <Settings className="w-4 h-4" />
                  Settings
                </div>
              </SettingsModal>
              
              {status === 'authenticated' ? (
                <button 
                  onClick={() => signOut({ redirectTo: '/signin' })}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <Link 
                  href="/signin"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors w-full"
                >
                  <User className="w-4 h-4" />
                  Sign In / Sign Up
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
