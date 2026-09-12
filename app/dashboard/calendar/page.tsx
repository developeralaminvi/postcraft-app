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
  Globe
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

  // Get posts for a specific date
  const getPostsForDay = (day: number) => {
    return posts.filter((post) => {
      const dateStr = post.scheduledAt || post.publishedAt || post.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return (
        d.getDate() === day &&
        d.getMonth() === month &&
        d.getFullYear() === year
      );
    });
  };

  const handleDayClick = (day: number) => {
    const selected = new Date(year, month, day, 12, 0);
    // Format to YYYY-MM-DDThh:mm
    selected.setMinutes(selected.getMinutes() - selected.getTimezoneOffset());
    const isoString = selected.toISOString().slice(0, 16);
    router.push(`/dashboard/create-post?scheduledAt=${isoString}`);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {monthNames[month]} {year}
            </h1>
            <p className="text-xs text-slate-500">
              Interactive visual content planner & queue schedule
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
          >
            Today
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-50 text-slate-600 border-r border-slate-200 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-50 text-slate-600 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Link
            href="/dashboard/create-post"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition ml-2"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule
          </Link>
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
            <div key={`empty-${i}`} className="bg-slate-50/40 min-h-[110px] p-2" />
          ))}

          {/* Day Cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const today = isToday(day);
            const dayPosts = getPostsForDay(day);

            return (
              <div
                key={`day-${day}`}
                className={`min-h-[110px] p-2 flex flex-col group transition relative hover:bg-indigo-50/20 ${
                  today ? 'bg-indigo-50/30' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      today
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>

                  <button
                    onClick={() => handleDayClick(day)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-indigo-600 hover:bg-indigo-100 rounded transition"
                    title="Schedule on this day"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Posts on this day */}
                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-36">
                  {dayPosts.map((post) => {
                    const isPublished = post.status === 'PUBLISHED';
                    const isScheduled = post.status === 'SCHEDULED';

                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`p-1.5 rounded-lg border text-left cursor-pointer transition shadow-2xs ${
                          isPublished
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                            : isScheduled
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] font-semibold mb-0.5">
                          <span className="truncate flex items-center gap-1">
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
                            ) : null}
                            {post.account?.name || 'FB'}
                          </span>
                          <span className="flex items-center gap-0.5 flex-shrink-0">
                            {post.mediaType === 'VIDEO' ? (
                              <Video className="w-2.5 h-2.5" />
                            ) : post.mediaUrl ? (
                              <ImageIcon className="w-2.5 h-2.5" />
                            ) : null}
                          </span>
                        </div>
                        <p className="text-[11px] line-clamp-1 opacity-90 leading-tight">
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

      {/* Post Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {selectedPost.account?.platform === 'LINKEDIN' ? (
                  <span className="p-1 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center">
                    <Linkedin className="w-3.5 h-3.5" />
                  </span>
                ) : selectedPost.account?.platform === 'INSTAGRAM' ? (
                  <span className="p-1 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center">
                    <Instagram className="w-3.5 h-3.5" />
                  </span>
                ) : null}
                <span className="font-bold text-sm text-slate-900">
                  {selectedPost.account?.name}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedPost.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {selectedPost.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                      : 'bg-blue-600 hover:bg-blue-700'
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