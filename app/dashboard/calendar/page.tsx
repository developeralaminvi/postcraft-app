'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Plus,
  Video,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  ExternalLink,
  X,
  ThumbsUp,
  Instagram,
  Linkedin,
  Facebook,
  Globe,
  GripVertical,
  ArrowRight,
  Check,
  AlertCircle,
} from 'lucide-react';

interface Milestone {
  id: string;
  type: string;
  threshold: number;
  commentText: string;
  isTriggered: boolean;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  mediaUrl?: string;
  mediaType: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  platformPostUrl?: string;
  reactionsCount: number;
  commentsCount: number;
  account: {
    name: string;
    avatar?: string;
    platform?: string;
  };
  comments: Array<{ content: string; status: string }>;
  milestones: Milestone[];
  autoReply?: { isEnabled: boolean; replyText: string };
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Drag & Drop and Reschedule states
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) setPosts(data.posts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isTomorrow = (day: number) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      tomorrow.getDate() === day &&
      tomorrow.getMonth() === month &&
      tomorrow.getFullYear() === year
    );
  };

  // Get posts for a specific date
  const getPostsForDay = (day: number) => {
    return posts.filter((post) => {
      const dateStr = post.scheduledAt || post.publishedAt || (post.status !== 'DRAFT' ? post.createdAt : null);
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return (
        d.getDate() === day &&
        d.getMonth() === month &&
        d.getFullYear() === year
      );
    });
  };

  // Unscheduled or draft posts
  const unscheduledPosts = posts.filter(
    (post) => post.status === 'DRAFT' || !post.scheduledAt
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Drop post on a day
  const handleDropOnDay = async (postId: string, day: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    let hour = 18;
    let minute = 0;
    if (post.scheduledAt) {
      const prev = new Date(post.scheduledAt);
      hour = prev.getHours();
      minute = prev.getMinutes();
    }

    const targetDate = new Date(year, month, day, hour, minute);
    const targetIso = targetDate.toISOString();

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, scheduledAt: targetIso, status: 'SCHEDULED' } : p
      )
    );

    const dayName = isToday(day) ? 'আজকে' : isTomorrow(day) ? 'কালকে' : `${day} ${monthNames[month]}`;
    showToast(`✅ পোস্টটি "${dayName}" তারিখে সফলভাবে শিডিউল করা হয়েছে!`);

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: targetIso, status: 'SCHEDULED' }),
      });
      if (!res.ok) {
        throw new Error('Failed to update schedule');
      }
    } catch (err) {
      console.error('Error rescheduling post:', err);
      showToast('শিডিউল আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    }
  };

  // Quick schedule for today or tomorrow via button
  const handleQuickSchedulePost = async (postId: string, targetDay: 'today' | 'tomorrow') => {
    const target = new Date();
    if (targetDay === 'tomorrow') {
      target.setDate(target.getDate() + 1);
    }
    target.setHours(18, 0, 0, 0); // Default 6:00 PM
    const targetIso = target.toISOString();

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, scheduledAt: targetIso, status: 'SCHEDULED' } : p
      )
    );

    showToast(`✅ পোস্টটি সফলভাবে ${targetDay === 'today' ? 'আজকের' : 'আগামীকালের'} ক্যালেন্ডারে শিডিউল করা হয়েছে!`);

    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: targetIso, status: 'SCHEDULED' }),
      });
    } catch (err) {
      console.error(err);
      showToast('শিডিউল আপডেট করতে সমস্যা হয়েছে।', 'error');
    }
  };

  const handleDayClick = (day: number) => {
    const selected = new Date(year, month, day, 18, 0);
    selected.setMinutes(selected.getMinutes() - selected.getTimezoneOffset());
    const isoString = selected.toISOString().slice(0, 16);
    router.push(`/dashboard/create-post?scheduledAt=${isoString}`);
  };

  return (
    <div className="space-y-6 max-w-7xl relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700 shadow-indigo-900/20'
              : 'bg-rose-900 text-white border-rose-700 shadow-rose-900/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {monthNames[month]} {year}
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                ড্র্যাগ & ড্রপ ক্যালেন্ডার
              </span>
            </div>
            <p className="text-xs text-slate-500">
              পোস্ট টেনে এনে ড্রপ করে বা ডেট সিলেক্ট করে নিমেষেই শিডিউল করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
          >
            ⚡ আজকে (Today)
          </button>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-50 text-slate-600 border-r border-slate-200 transition cursor-pointer"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Link
            href="/dashboard/create-post"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> নতুন পোস্ট তৈরি ও শিডিউল
          </Link>
        </div>
      </div>

      {/* Helpful Drag & Drop Tip banner */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-purple-50/90 p-3.5 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3 text-xs text-indigo-950 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="h-7 w-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
            💡
          </span>
          <p className="font-medium">
            <strong className="font-bold text-indigo-900">সহজ শিডিউলিং:</strong> যেকোনো পোস্টকে মাউস দিয়ে ধরে (Drag) ক্যালেন্ডারের আজকের, কালকের বা যেকোনো তারিখের ঘরে ছেড়ে দিলেই (Drop) স্বয়ংক্রিয়ভাবে শিডিউল হয়ে যাবে!
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[600px]">
          {/* Empty cells before month start */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/40 min-h-[120px] p-2" />
          ))}

          {/* Day Cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const today = isToday(day);
            const tomorrow = isTomorrow(day);
            const isHovered = dragOverDay === day;
            const dayPosts = getPostsForDay(day);

            return (
              <div
                key={`day-${day}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverDay !== day) setDragOverDay(day);
                }}
                onDragLeave={() => {
                  if (dragOverDay === day) setDragOverDay(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverDay(null);
                  const postId = e.dataTransfer.getData('text/plain') || draggingPostId;
                  if (postId) {
                    handleDropOnDay(postId, day);
                  }
                }}
                className={`min-h-[120px] p-2 flex flex-col group transition-all relative ${
                  isHovered
                    ? 'bg-indigo-100/70 ring-2 ring-indigo-500 ring-inset z-10'
                    : today
                    ? 'bg-indigo-50/40 ring-1 ring-indigo-200 ring-inset'
                    : tomorrow
                    ? 'bg-amber-50/30 ring-1 ring-amber-200/70 ring-inset'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        today
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : tomorrow
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-700 group-hover:text-indigo-600'
                      }`}
                    >
                      {day}
                    </span>
                    {today && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded-md">
                        আজকে
                      </span>
                    )}
                    {tomorrow && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-md">
                        কালকে
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDayClick(day)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                    title={`${day} তারিখে নতুন পোস্ট শিডিউল করুন`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Posts on this day */}
                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-36">
                  {dayPosts.map((post) => {
                    const isPublished = post.status === 'PUBLISHED';
                    const isScheduled = post.status === 'SCHEDULED';
                    const isBeingDragged = draggingPostId === post.id;

                    return (
                      <div
                        key={post.id}
                        draggable={!isPublished}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', post.id);
                          setDraggingPostId(post.id);
                        }}
                        onDragEnd={() => setDraggingPostId(null)}
                        onClick={() => setSelectedPost(post)}
                        className={`p-1.5 rounded-xl border text-left cursor-pointer transition shadow-2xs group/card relative ${
                          isBeingDragged ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''
                        } ${
                          isPublished
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                            : isScheduled
                            ? 'bg-amber-50/90 border-amber-200 text-amber-950 hover:bg-amber-100 cursor-grab active:cursor-grabbing'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 cursor-grab active:cursor-grabbing'
                        }`}
                        title={!isPublished ? 'টেনে নিয়ে অন্য তারিখে ড্রপ করুন' : 'পাবলিশড পোস্ট'}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold mb-0.5">
                          <span className="truncate flex items-center gap-1">
                            {!isPublished && (
                              <GripVertical className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/card:opacity-100 transition flex-shrink-0" />
                            )}
                            {post.account?.platform === 'WORDPRESS' ? (
                              <span className="p-0.5 rounded bg-[#21759B] text-white inline-flex items-center justify-center">
                                <Globe className="w-2.5 h-2.5" />
                              </span>
                            ) : post.account?.platform === 'LINKEDIN' ? (
                              <span className="p-0.5 rounded bg-[#0A66C2] text-white inline-flex items-center justify-center">
                                <Linkedin className="w-2.5 h-2.5" />
                              </span>
                            ) : post.account?.platform === 'INSTAGRAM' ? (
                              <span className="p-0.5 rounded bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white inline-flex items-center justify-center">
                                <Instagram className="w-2.5 h-2.5" />
                              </span>
                            ) : (
                              <span className="p-0.5 rounded bg-[#1877F2] text-white inline-flex items-center justify-center">
                                <Facebook className="w-2.5 h-2.5" />
                              </span>
                            )}
                            {post.account?.name || 'Social'}
                          </span>
                          <span className="flex items-center gap-0.5 flex-shrink-0">
                            {post.scheduledAt && (
                              <span className="text-[9px] font-semibold opacity-75">
                                {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {post.mediaType === 'VIDEO' ? (
                              <Video className="w-2.5 h-2.5" />
                            ) : post.mediaUrl ? (
                              <ImageIcon className="w-2.5 h-2.5" />
                            ) : null}
                          </span>
                        </div>
                        <p className="text-[11px] line-clamp-1 opacity-90 leading-tight font-medium">
                          {post.title || post.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UNSCHEDULED & DRAFT POSTS TRAY (Drag-Ready Queue) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📋 অনির্ধারিত ড্রাফট পোস্ট কিউ (Unscheduled / Draft Queue)</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {unscheduledPosts.length}
              </span>
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            এখান থেকে পোস্ট টেনে (Drag) উপরে ক্যালেন্ডারের যেকোনো তারিখে ছেড়ে দিন
          </span>
        </div>

        {unscheduledPosts.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
            বর্তমানে কোনো অনির্ধারিত ড্রাফট পোস্ট নেই। সব পোস্ট ক্যালেন্ডারে শিডিউল করা আছে! 🎉
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {unscheduledPosts.map((post) => (
              <div
                key={post.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', post.id);
                  setDraggingPostId(post.id);
                }}
                onDragEnd={() => setDraggingPostId(null)}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition cursor-grab active:cursor-grabbing flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {post.account?.platform === 'WORDPRESS' ? (
                        <span className="p-1 rounded bg-[#21759B] text-white">
                          <Globe className="w-3 h-3" />
                        </span>
                      ) : post.account?.platform === 'LINKEDIN' ? (
                        <span className="p-1 rounded bg-[#0A66C2] text-white">
                          <Linkedin className="w-3 h-3" />
                        </span>
                      ) : post.account?.platform === 'INSTAGRAM' ? (
                        <span className="p-1 rounded bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white">
                          <Instagram className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-[#1877F2] text-white">
                          <Facebook className="w-3 h-3" />
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                        {post.account?.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {post.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-medium">
                    {post.title || post.content}
                  </p>
                </div>

                {/* Quick Schedule Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <GripVertical className="w-3 h-3 text-slate-400" /> ড্র্যাগ করুন
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickSchedulePost(post.id, 'today')}
                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition border border-indigo-200 cursor-pointer"
                    >
                      ⚡ আজকে
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSchedulePost(post.id, 'tomorrow')}
                      className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold transition border border-amber-200 cursor-pointer"
                    >
                      📅 কালকে
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Details & Reschedule Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {selectedPost.account?.platform === 'WORDPRESS' ? (
                  <span className="p-1 rounded-lg bg-[#21759B] text-white flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5" />
                  </span>
                ) : selectedPost.account?.platform === 'LINKEDIN' ? (
                  <span className="p-1 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center">
                    <Linkedin className="w-3.5 h-3.5" />
                  </span>
                ) : selectedPost.account?.platform === 'INSTAGRAM' ? (
                  <span className="p-1 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center">
                    <Instagram className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="p-1 rounded-lg bg-[#1877F2] text-white flex items-center justify-center">
                    <Facebook className="w-3.5 h-3.5" />
                  </span>
                )}
                <span className="font-bold text-sm text-slate-900">
                  {selectedPost.account?.name}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedPost.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedPost.status === 'SCHEDULED'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {selectedPost.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Reschedule Section if not published */}
            {selectedPost.status !== 'PUBLISHED' && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" /> শিডিউল পরিবর্তন করুন (Reschedule Date)
                  </p>
                  {selectedPost.scheduledAt && (
                    <span className="text-[10px] font-semibold text-indigo-700">
                      বর্তমান: {new Date(selectedPost.scheduledAt).toLocaleDateString()} {new Date(selectedPost.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickSchedulePost(selectedPost.id, 'today');
                      setSelectedPost(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 shadow-2xs transition cursor-pointer"
                  >
                    ⚡ আজকের দিনে শিডিউল
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickSchedulePost(selectedPost.id, 'tomorrow');
                      setSelectedPost(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 shadow-2xs transition cursor-pointer"
                  >
                    📅 আগামীকালের দিনে শিডিউল
                  </button>
                </div>
              </div>
            )}

            {/* Post Title if available */}
            {selectedPost.title && (
              <div>
                <p className="text-xs font-semibold text-[#21759B] uppercase tracking-wider mb-1">
                  Article Title
                </p>
                <p className="text-sm font-bold text-slate-900 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  {selectedPost.title}
                </p>
              </div>
            )}

            {/* Post Content */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Content
              </p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                {selectedPost.content}
              </p>
            </div>

            {/* Media Preview */}
            {selectedPost.mediaUrl && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Attached Media ({selectedPost.mediaType})
                </p>
                {selectedPost.mediaType === 'VIDEO' ? (
                  <video
                    src={selectedPost.mediaUrl}
                    controls
                    className="w-full rounded-xl max-h-56 bg-black"
                  />
                ) : (
                  <img
                    src={selectedPost.mediaUrl}
                    alt="Media"
                    className="w-full rounded-xl max-h-56 object-cover border border-slate-200"
                  />
                )}
              </div>
            )}

            {/* First Comment */}
            {selectedPost.comments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> First Comment ({selectedPost.comments[0].status})
                </p>
                <p className="text-xs text-slate-700 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                  {selectedPost.comments[0].content}
                </p>
              </div>
            )}

            {/* Milestone Triggers */}
            {selectedPost.milestones.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> Engagement Milestone Triggers
                </p>
                <div className="space-y-1.5">
                  {selectedPost.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="text-xs p-2 rounded-lg bg-amber-50/60 border border-amber-200/80 flex items-center justify-between"
                    >
                      <span className="font-semibold text-amber-900">
                        At {m.threshold} {m.type.toLowerCase()}: &quot;{m.commentText}&quot;
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-amber-800 font-bold border border-amber-200">
                        {m.isTriggered ? 'Triggered ✅' : 'Pending ⏳'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto Reply */}
            {selectedPost.autoReply?.isEnabled && (
              <div>
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Comment Auto-Reply (Active)
                </p>
                <p className="text-xs text-slate-700 bg-violet-50/50 p-2.5 rounded-xl border border-violet-100">
                  &quot;{selectedPost.autoReply.replyText}&quot;
                </p>
              </div>
            )}

            {selectedPost.platformPostUrl && (
              <div className="pt-2">
                <a
                  href={selectedPost.platformPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold transition ${
                    selectedPost.account?.platform === 'WORDPRESS'
                      ? 'bg-[#21759B] hover:bg-[#1a5f7e]'
                      : selectedPost.account?.platform === 'LINKEDIN'
                      ? 'bg-[#0A66C2] hover:bg-[#004182]'
                      : selectedPost.account?.platform === 'INSTAGRAM'
                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90'
                      : 'bg-[#1877F2] hover:bg-blue-700'
                  }`}
                >
                  {selectedPost.account?.platform === 'WORDPRESS'
                    ? 'View Live on WordPress'
                    : selectedPost.account?.platform === 'LINKEDIN'
                    ? 'View Live on LinkedIn'
                    : selectedPost.account?.platform === 'INSTAGRAM'
                    ? 'View Live on Instagram'
                    : 'View Live on Facebook'}{' '}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}