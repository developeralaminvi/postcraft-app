'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send,
  Calendar,
  Image as ImageIcon,
  Video,
  UploadCloud,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ThumbsUp,
  Share2,
  MessageCircle,
  Loader2,
  Globe,
  Plus,
  Trash2,
  X
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  avatar?: string;
  accountId: string;
}

interface MilestoneInput {
  id: string;
  type: 'LIKES' | 'COMMENTS';
  threshold: number;
  commentText: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [content, setContent] = useState('');

  // Media state
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'TEXT' | 'IMAGE' | 'VIDEO'>('TEXT');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Publishing state
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  // First Comment state
  const [enableFirstComment, setEnableFirstComment] = useState(true);
  const [firstCommentContent, setFirstCommentContent] = useState('');
  const [firstCommentDelay, setFirstCommentDelay] = useState<number>(0);

  // Auto-Reply state
  const [enableAutoReply, setEnableAutoReply] = useState(false);
  const [autoReplyText, setAutoReplyText] = useState('Thanks for checking this out! Send us a DM or visit our page for more details! 🙌');

  // Milestone Triggers state
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    {
      id: '1',
      type: 'LIKES',
      threshold: 10,
      commentText: '🎉 Wow, thank you for 10 likes! Here is the special bonus link for our community: https://postcraft.io/special',
    },
    {
      id: '2',
      type: 'COMMENTS',
      threshold: 20,
      commentText: '🔥 20 comments reached! We are answering all your questions below.',
    },
  ]);
  const [enableMilestones, setEnableMilestones] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts && data.accounts.length > 0) {
          setAccounts(data.accounts);
          setSelectedAccountId(data.accounts[0].id);
        }
      })
      .catch(console.error);

    const paramDate = searchParams.get('scheduledAt');
    if (paramDate) {
      setPublishMode('schedule');
      setScheduledAt(paramDate);
    } else {
      const d = new Date(Date.now() + 60 * 60 * 1000);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setScheduledAt(d.toISOString().slice(0, 16));
    }
  }, [searchParams]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Direct File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to upload media');
        return;
      }

      setMediaUrl(data.url);
      setMediaType(data.mediaType);
    } catch (err: any) {
      setError(err?.message || 'Network error during upload');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = () => {
    setMediaUrl('');
    setMediaType('TEXT');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addMilestone = (type: 'LIKES' | 'COMMENTS', threshold: number) => {
    setMilestones([
      ...milestones,
      {
        id: Date.now().toString(),
        type,
        threshold,
        commentText: `🎉 Milestone reached: ${threshold} ${type.toLowerCase()}!`,
      },
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedAccountId) {
      setError('Please select or connect a Facebook Page first.');
      return;
    }

    if (!content.trim()) {
      setError('Post content cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          content,
          mediaUrl: mediaUrl.trim() || undefined,
          mediaType: mediaType,
          publishNow: publishMode === 'now',
          scheduledAt: publishMode === 'schedule' ? scheduledAt : undefined,
          autoComment: enableFirstComment && firstCommentContent.trim()
            ? {
                enabled: true,
                content: firstCommentContent.trim(),
                delayMinutes: firstCommentDelay,
              }
            : undefined,
          autoReply: enableAutoReply && autoReplyText.trim()
            ? {
                isEnabled: true,
                replyText: autoReplyText.trim(),
              }
            : undefined,
          milestoneTriggers: enableMilestones ? milestones : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit post');
        return;
      }

      setSuccess(
        publishMode === 'now'
          ? 'Post published to Facebook successfully!'
          : 'Post scheduled successfully!'
      );

      setTimeout(() => {
        router.push('/dashboard/calendar');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Post Composer Studio</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload media, schedule content, and configure intelligent comment automations.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Composer Form (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Target Account */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Publishing Account
            </label>

            {accounts.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span>No Facebook Page connected yet.</span>
                <a href="/dashboard/accounts" className="font-semibold underline text-amber-900">
                  Connect Page
                </a>
              </div>
            ) : (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    Facebook: {acc.name} ({acc.accountId})
                  </option>
                ))}
              </select>
            )}

            {/* Post Caption */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Post Caption
                </label>
                <span className="text-xs text-slate-400">{content.length} characters</span>
              </div>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What would you like to share with your audience? Write your story, announcements, or thoughts here..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition leading-relaxed"
              />
            </div>

            {/* Direct Media Upload (Images & Videos) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Media Attachment (Direct Upload: Image or Video)
              </label>

              {!mediaUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/30 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition shadow-xs">
                    {uploadingMedia ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {uploadingMedia ? 'Uploading media...' : 'Click to browse or drag & drop file'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Supports JPG, PNG, GIF, WEBP or MP4, MOV videos
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                  {mediaType === 'VIDEO' ? (
                    <video src={mediaUrl} controls className="w-full max-h-64 object-cover" />
                  ) : (
                    <img src={mediaUrl} alt="Uploaded" className="w-full max-h-64 object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-white transition shadow-md"
                    title="Remove media"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white uppercase tracking-wider">
                    {mediaType} Attached
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 1: Automated First Comment */}
          <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Automated First Comment</h3>
                  <p className="text-[11px] text-slate-500">
                    Instantly drop your link or call-to-action in comment #1
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFirstComment}
                  onChange={(e) => setEnableFirstComment(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {enableFirstComment && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <textarea
                  rows={2}
                  value={firstCommentContent}
                  onChange={(e) => setFirstCommentContent(e.target.value)}
                  placeholder="👉 Full tutorial & download link: https://example.com"
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600">Timing:</span>
                  <select
                    value={firstCommentDelay}
                    onChange={(e) => setFirstCommentDelay(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value={0}>Instant (Drop with post)</option>
                    <option value={5}>Delay by 5 minutes</option>
                    <option value={15}>Delay by 15 minutes</option>
                    <option value={30}>Delay by 30 minutes</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Engagement Milestone Comment Triggers */}
          <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Engagement Milestone Triggers
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Drop automated comments when reaching like/comment targets
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMilestones}
                  onChange={(e) => setEnableMilestones(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {enableMilestones && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-600">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => addMilestone('LIKES', 10)}
                    className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 hover:bg-amber-100"
                  >
                    + 10 Likes Trigger
                  </button>
                  <button
                    type="button"
                    onClick={() => addMilestone('COMMENTS', 20)}
                    className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 hover:bg-amber-100"
                  >
                    + 20 Comments Trigger
                  </button>
                </div>

                <div className="space-y-2.5">
                  {milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            When post hits:
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={m.threshold}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[idx].threshold = Number(e.target.value);
                              setMilestones(updated);
                            }}
                            className="w-16 px-2 py-1 text-xs border rounded bg-white font-bold"
                          />
                          <select
                            value={m.type}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[idx].type = e.target.value as any;
                              setMilestones(updated);
                            }}
                            className="px-2 py-1 text-xs border rounded bg-white font-semibold"
                          >
                            <option value="LIKES">Likes / Reactions</option>
                            <option value="COMMENTS">Comments</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMilestone(m.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={m.commentText}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].commentText = e.target.value;
                          setMilestones(updated);
                        }}
                        placeholder="Write the automated comment to publish..."
                        className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Auto-Reply to User Comments */}
          <div className="bg-white p-6 rounded-2xl border border-violet-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Auto-Reply to User Comments</h3>
                  <p className="text-[11px] text-slate-500">
                    Automatically reply whenever someone leaves a comment
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAutoReply}
                  onChange={(e) => setEnableAutoReply(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>

            {enableAutoReply && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Reply Message Template
                </label>
                <textarea
                  rows={2}
                  value={autoReplyText}
                  onChange={(e) => setAutoReplyText(e.target.value)}
                  placeholder="Thanks for commenting! Check your inbox or visit our link..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500 text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Publishing Schedule & Submit */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPublishMode('now')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  publishMode === 'now'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Send className="w-4 h-4" /> Publish Now
              </button>

              <button
                type="button"
                onClick={() => setPublishMode('schedule')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  publishMode === 'schedule'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" /> Schedule Later
              </button>
            </div>

            {publishMode === 'schedule' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || accounts.length === 0 || uploadingMedia}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                </>
              ) : publishMode === 'now' ? (
                <>
                  <Send className="w-4 h-4" /> Publish Live Post & Automations
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" /> Add to Queue & Calendar
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right: Live Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Mockup Preview
            </span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              Facebook Desktop
            </span>
          </div>

          {/* Facebook Card Mockup */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 overflow-hidden">
                {selectedAccount?.avatar ? (
                  <img src={selectedAccount.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  selectedAccount?.name?.slice(0, 2).toUpperCase() || 'FB'
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 leading-snug truncate">
                  {selectedAccount?.name || 'Your Facebook Page'}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  Just now · <Globe className="w-3 h-3 text-slate-400 inline" />
                </p>
              </div>
            </div>

            {/* Post Text */}
            <div className="px-4 pb-3">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {content || 'Your post caption will appear here in real time...'}
              </p>
            </div>

            {/* Media Preview (Video or Image) */}
            {mediaUrl && (
              <div className="w-full bg-slate-900 max-h-80 overflow-hidden flex items-center justify-center border-t border-b border-slate-100">
                {mediaType === 'VIDEO' ? (
                  <video src={mediaUrl} controls className="w-full max-h-80 object-cover" />
                ) : (
                  <img src={mediaUrl} alt="Attachment" className="w-full object-cover max-h-80" />
                )}
              </div>
            )}

            {/* Reaction bar */}
            <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-around text-slate-500 text-xs font-semibold">
              <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer py-1">
                <ThumbsUp className="w-4 h-4" /> Like
              </span>
              <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer py-1">
                <MessageCircle className="w-4 h-4" /> Comment
              </span>
              <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer py-1">
                <Share2 className="w-4 h-4" /> Share
              </span>
            </div>

            {/* Auto First Comment Preview */}
            {enableFirstComment && firstCommentContent.trim() && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto First Comment ({firstCommentDelay === 0 ? 'Instant' : `+${firstCommentDelay}m`})
                </span>

                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {selectedAccount?.name?.slice(0, 1).toUpperCase() || 'P'}
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-2xs max-w-sm">
                    <p className="text-xs font-semibold text-slate-900">
                      {selectedAccount?.name || 'Page Name'}
                    </p>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap mt-0.5 leading-relaxed">
                      {firstCommentContent}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Planned Milestone Triggers Summary */}
            {enableMilestones && milestones.length > 0 && (
              <div className="p-3 bg-amber-50/50 border-t border-amber-100 text-[11px] space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> Active Milestone Triggers:
                </span>
                {milestones.map((m) => (
                  <p key={m.id} className="text-amber-800 text-[10px]">
                    • At {m.threshold} {m.type.toLowerCase()}: &quot;{m.commentText.slice(0, 45)}...&quot;
                  </p>
                ))}
              </div>
            )}

            {/* Auto-Reply Summary */}
            {enableAutoReply && autoReplyText.trim() && (
              <div className="p-3 bg-violet-50/50 border-t border-violet-100 text-[11px]">
                <span className="font-bold text-violet-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-Reply to User Comments Active:
                </span>
                <p className="text-violet-800 text-[10px] mt-0.5">
                  &quot;{autoReplyText.slice(0, 50)}...&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}