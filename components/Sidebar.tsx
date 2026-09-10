'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  ListOrdered,
  Share2,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ user }: { user?: { name?: string | null; email: string } | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Create Post', href: '/dashboard/create-post', icon: PenSquare },
    { label: 'Content Calendar', href: '/dashboard/calendar', icon: CalendarDays },
    { label: 'Posts & Queue', href: '/dashboard/posts', icon: ListOrdered },
    { label: 'Connected Accounts', href: '/dashboard/accounts', icon: Share2 },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerQueue = async () => {
    setIsRunningCron(true);
    setCronMessage(null);
    try {
      const res = await fetch('/api/cron/process', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCronMessage(`Queue checked: ${data.postsProcessed || 0} posts, ${data.commentsProcessed || 0} comments, ${data.milestonesTriggered || 0} milestones.`);
        setTimeout(() => setCronMessage(null), 5000);
        router.refresh();
      } else {
        setCronMessage('Error checking queue');
      }
    } catch (err) {
      setCronMessage('Network error');
    } finally {
      setIsRunningCron(false);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-900 tracking-tight">PostCraft</h1>
          <p className="text-xs text-slate-400 font-medium">Social Auto-Pilot SaaS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Queue Scheduler Box */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Queue Engine
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
          Polls due posts, auto-comments, and engagement milestones.
        </p>
        <button
          onClick={handleTriggerQueue}
          disabled={isRunningCron}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-xs disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRunningCron ? 'animate-spin' : ''}`} />
          {isRunningCron ? 'Processing...' : 'Run Queue Now'}
        </button>
        {cronMessage && (
          <p className="mt-2 text-[10px] text-indigo-600 font-medium bg-indigo-50 p-1.5 rounded">
            {cronMessage}
          </p>
        )}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-medium text-slate-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}