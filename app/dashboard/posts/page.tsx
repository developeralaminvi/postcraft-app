'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Send,
  MessageSquare,
  PenSquare,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  status: string;
  delayMinutes: number;
  scheduledAt?: string;
  publishedAt?: string;
  errorMessage?: string;
}

interface Post {
  id: string;
  content: string;
  mediaUrl?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  scheduledAt?: string;
  publishedAt?: string;
  platformPostId?: string;
  platformPostUrl?: string;
  errorMessage?: string;
  createdAt: string;
  account: {
    id: string;
    name: string;
    platform: string;
    avatar?: string;
    accountId: string;
  };
  comments: Comment[];
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePublishNow = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        fetchPosts();
      } else {
        alert(data.error || 'Failed to publish post');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Posts & Delivery Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor queued posts, execution history, and auto-comment delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPosts}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/dashboard/create-post"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
          >
            <PenSquare className="w-4 h-4" /> New Post
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(['ALL', 'SCHEDULED', 'PUBLISHED', 'FAILED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === tab
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab} (
            {tab === 'ALL'
              ? posts.length
              : posts.filter((p) => p.status === tab).length}
            )
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-base text-slate-800">No posts found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {filter === 'ALL'
              ? 'Start by creating your first scheduled post!'
              : `No posts with status ${filter}.`}
          </p>
          <Link
            href="/dashboard/create-post"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
          >
            Create Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const isPublished = post.status === 'PUBLISHED';
            const isScheduled = post.status === 'SCHEDULED';
            const isFailed = post.status === 'FAILED';
            const comment = post.comments[0];

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Account & Status Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl text-white flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden ${
                        post.account.platform === 'INSTAGRAM'
                          ? 'bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600'
                          : 'bg-blue-600'
                      }`}
                    >
                      {post.account.avatar ? (
                        <img
                          src={post.account.avatar}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        post.account.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {post.account.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            post.account.platform === 'INSTAGRAM'
                              ? 'bg-pink-50 text-pink-700 border-pink-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {post.account.platform}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isScheduled
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isFailed
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {isPublished && post.publishedAt && (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Published:{' '}
                            {new Date(post.publishedAt).toLocaleString()}
                          </span>
                        )}
                        {isScheduled && post.scheduledAt && (
                          <span className="flex items-center gap-1 text-amber-600 font-medium mt-0.5">
                            <Clock className="w-3 h-3" /> Scheduled for:{' '}
                            {new Date(post.scheduledAt).toLocaleString()}
                          </span>
                        )}
                        {isFailed && (
                          <span className="flex items-center gap-1 text-rose-600 font-medium mt-0.5">
                            <AlertCircle className="w-3 h-3" /> {post.errorMessage || 'Publishing failed'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {post.platformPostUrl && (
                      <a
                        href={post.platformPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View on {post.account.platform === 'INSTAGRAM' ? 'Instagram' : 'Facebook'}
                      </a>
                    )}

                    {isScheduled && (
                      <button
                        onClick={() => handlePublishNow(post.id)}
                        disabled={actionLoading === post.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition disabled:opacity-50"
                      >
                        {actionLoading === post.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Publish Now
                      </button>
                    )}

                    {post.platformPostUrl && (
                      <a
                        href={post.platformPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        Facebook <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content & Media body */}
                <div className="mt-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-13">
                  {post.content}
                </div>

                {post.mediaUrl && (
                  <div className="mt-3 pl-13">
                    <img
                      src={post.mediaUrl}
                      alt="Attachment"
                      className="h-28 rounded-xl object-cover border border-slate-200"
                    />
                  </div>
                )}

                {/* First Comment Tracking Section */}
                {comment && (
                  <div className="mt-4 pt-3 border-t border-slate-100 pl-13">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                      <div className="h-6 w-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-slate-900">
                            Automated First Comment
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                              comment.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : comment.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {comment.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {comment.delayMinutes === 0
                              ? 'Instant'
                              : `+${comment.delayMinutes}m delay`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        {comment.errorMessage && (
                          <p className="text-[10px] text-rose-600 font-medium mt-1">
                            Error: {comment.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}