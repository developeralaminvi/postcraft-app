'use client';

import React, { useState, useEffect } from 'react';
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
  Radio,
  Plus,
  ChevronRight,
} from 'lucide-react';
import ChannelAvatar from '@/components/ChannelAvatar';

interface SidebarAccount {
  id: string;
  name: string;
  platform: string;
  avatar?: string;
  accountId: string;
}

export default function Sidebar({ user }: { user?: { name?: string | null; email: string } | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);
  const [channels, setChannels] = useState<SidebarAccount[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts) setChannels(data.accounts);
      })
      .catch(console.error)
      .finally(() => setChannelsLoading(false));
  }, [pathname]);

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

      {/* Scrollable Navigation & Channels Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CHANNELS PANEL (As shown in user reference image) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between px-1 mb-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              Channels
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {channels.length}
              </span>
            </span>
            <Link
              href="/dashboard/accounts"
              className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Manage
            </Link>
          </div>

          {/* Quick Buttons: Add Channel & Create Post */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <Link
              href="/dashboard/accounts"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition shadow-2xs"
            >
              <Radio className="w-3 h-3 text-indigo-600" /> Add Channel
            </Link>
            <Link
              href="/dashboard/create-post"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition shadow-2xs"
            >
              <Plus className="w-3 h-3" /> Create Post
            </Link>
          </div>

          {/* Channels List */}
          <div className="space-y-1">
            {channelsLoading ? (
              <div className="p-3 text-center text-[11px] text-slate-400">Loading channels...</div>
            ) : channels.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-medium">No channels added</p>
                <Link
                  href="/dashboard/accounts"
                  className="mt-1 text-[11px] text-indigo-600 font-semibold hover:underline block"
                >
                  + Connect your first channel
                </Link>
              </div>
            ) : (
              channels.map((chan) => (
                <Link
                  key={chan.id}
                  href={`/dashboard/create-post?accountId=${chan.id}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/80 transition group"
                  title={`Create post on ${chan.name}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ChannelAvatar
                      avatar={chan.avatar}
                      name={chan.name}
                      platform={chan.platform}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition">
                        {chan.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {chan.platform}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Queue Scheduler Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Queue Engine
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
            Polls due posts, auto-comments, and engagement milestones.
          </p>
          <button
            onClick={handleTriggerQueue}
            disabled={isRunningCron}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 text-slate-500 ${isRunningCron ? 'animate-spin' : ''}`} />
            {isRunningCron ? 'Processing...' : 'Run Queue Now'}
          </button>
          {cronMessage && (
            <p className="mt-2 text-[10px] text-indigo-600 font-medium bg-indigo-50 p-1.5 rounded">
              {cronMessage}
            </p>
          )}
        </div>
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