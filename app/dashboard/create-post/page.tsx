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
  X,
  Instagram,
  Heart,
  Bookmark,
  MoreHorizontal,
  AtSign,
  Users,
  UserCheck,
  Bell
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  avatar?: string;
  accountId: string;
  platform: string;
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

  // Mention & Tagging states and refs
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const firstCommentRef = useRef<HTMLTextAreaElement>(null);
  const autoReplyRef = useRef<HTMLTextAreaElement>(null);

  const [mentionState, setMentionState] = useState<{
    isOpen: boolean;
    targetField: 'content' | 'firstComment' | 'autoReply' | null;
    query: string;
    cursorIndex: number;
  }>({
    isOpen: false,
    targetField: null,
    query: '',
    cursorIndex: 0,
  });

  const AUDIENCE_TAGS = [
    { tag: '@everyone', name: 'Everyone', desc: 'Notify everyone in group or followers', type: 'audience' },
    { tag: '@followers', name: 'Followers', desc: 'Notify all active followers of the page', type: 'audience' },
    { tag: '@topfans', name: 'Top Fans', desc: 'Mention and notify your top fans', type: 'audience' },
    { tag: '@highlights', name: 'Highlights', desc: 'Highlight update in followers feed', type: 'audience' },
  ];

  const handleInputChangeWithMention = (
    field: 'content' | 'firstComment' | 'autoReply',
    val: string,
    cursorPos: number
  ) => {
    if (field === 'content') setContent(val);
    else if (field === 'firstComment') setFirstCommentContent(val);
    else if (field === 'autoReply') setAutoReplyText(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\.]*)$/);

    if (match) {
      setMentionState({
        isOpen: true,
        targetField: field,
        query: match[1] || '',
        cursorIndex: cursorPos,
      });
    } else {
      setMentionState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
    }
  };

  const insertMention = (mentionTag: string) => {
    const { targetField, cursorIndex, query } = mentionState;
    if (!targetField) return;

    const currentVal =
      targetField === 'content'
        ? content
        : targetField === 'firstComment'
        ? firstCommentContent
        : autoReplyText;

    const startIndex = cursorIndex - query.length - 1;
    const before = currentVal.slice(0, Math.max(0, startIndex));
    const after = currentVal.slice(cursorIndex);
    const tagWithPrefix = mentionTag.startsWith('@') || mentionTag.startsWith('{') ? mentionTag : `@${mentionTag}`;
    const newVal = `${before}${tagWithPrefix} ${after}`;
    const newCursorPos = before.length + tagWithPrefix.length + 1;

    if (targetField === 'content') {
      setContent(newVal);
      setTimeout(() => {
        contentRef.current?.focus();
        contentRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    } else if (targetField === 'firstComment') {
      setFirstCommentContent(newVal);
      setTimeout(() => {
        firstCommentRef.current?.focus();
        firstCommentRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    } else if (targetField === 'autoReply') {
      setAutoReplyText(newVal);
      setTimeout(() => {
        autoReplyRef.current?.focus();
        autoReplyRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    }

    setMentionState({ isOpen: false, targetField: null, query: '', cursorIndex: 0 });
  };

  const quickInsertMentionToField = (
    field: 'content' | 'firstComment' | 'autoReply',
    tag: string
  ) => {
    const tagToInsert = tag.startsWith('@') || tag.startsWith('{') ? `${tag} ` : `@${tag} `;
    if (field === 'content') {
      setContent((prev) => `${prev ? prev + ' ' : ''}${tagToInsert}`);
      contentRef.current?.focus();
    } else if (field === 'firstComment') {
      setFirstCommentContent((prev) => `${prev ? prev + ' ' : ''}${tagToInsert}`);
      firstCommentRef.current?.focus();
    } else if (field === 'autoReply') {
      setAutoReplyText((prev) => `${prev ? prev + ' ' : ''}${tagToInsert}`);
      autoReplyRef.current?.focus();
    }
  };

  const getFilteredSuggestions = () => {
    const q = mentionState.query.toLowerCase();
    const accountSuggestions = accounts.map((acc) => {
      const cleanHandle = acc.name.replace(/^@/, '').replace(/\s+/g, '');
      return {
        tag: `@${cleanHandle}`,
        name: acc.name,
        desc: `${acc.platform === 'INSTAGRAM' ? 'Instagram' : 'Facebook'} Account`,
        avatar: acc.avatar,
        type: 'account' as const,
      };
    });

    const list: Array<{ tag: string; name: string; desc: string; avatar?: string; type: string }> = [
      ...accountSuggestions,
      ...AUDIENCE_TAGS,
    ];

    if (q && !list.some((item) => item.tag.toLowerCase() === `@${q}`)) {
      list.push({
        tag: `@${q}`,
        name: `@${q}`,
        desc: 'Custom mention handle',
        avatar: undefined,
        type: 'custom',
      });
    }

    return list.filter(
      (item) =>
        item.tag.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
    );
  };

  const renderFormattedTextWithMentions = (
    text: string,
    platform: 'FACEBOOK' | 'INSTAGRAM' = 'FACEBOOK'
  ) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_\.]+|{[a-zA-Z0-9_]+})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        return (
          <span
            key={index}
            className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold text-[11px] border border-violet-200"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className={`font-semibold cursor-pointer hover:underline ${
              platform === 'INSTAGRAM'
                ? 'text-sky-600 bg-sky-50/70 px-1 py-0.5 rounded'
                : 'text-blue-600 bg-blue-50/70 px-1 py-0.5 rounded'
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderMentionDropdown = (field: 'content' | 'firstComment' | 'autoReply') => {
    if (!mentionState.isOpen || mentionState.targetField !== field) return null;
    const suggestions = getFilteredSuggestions();

    return (
      <div className="absolute left-0 right-0 z-30 mt-1 bg-white rounded-2xl shadow-xl border border-indigo-200 p-2 space-y-1">
        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-100">
          <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
            <AtSign className="w-3.5 h-3.5" /> Mention / Tag suggestions
          </span>
          <button
            type="button"
            onClick={() => setMentionState((prev) => ({ ...prev, isOpen: false }))}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="max-h-52 overflow-y-auto space-y-0.5">
          {suggestions.length === 0 ? (
            <p className="p-3 text-xs text-slate-400 text-center">No matching accounts or tags found</p>
          ) : (
            suggestions.map((item, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(item.tag);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.avatar ? (
                    <img src={item.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  ) : item.type === 'account' ? (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      @
                    </div>
                  ) : item.type === 'audience' ? (
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      👥
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      @
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                      {item.tag}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 flex-shrink-0 transition">
                  Insert
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

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

    const targetAccount = accounts.find((a) => a.id === selectedAccountId);
    const isInstagram = targetAccount?.platform === 'INSTAGRAM';

    if (!selectedAccountId) {
      setError('Please select or connect a social account first.');
      return;
    }

    if (isInstagram && !mediaUrl) {
      setError('Instagram posts require an image or video attachment. Please upload an image or video above before publishing.');
      return;
    }

    if (!content.trim()) {
      setError('Post caption cannot be empty.');
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
          ? `Post published to ${isInstagram ? 'Instagram' : 'Facebook'} successfully!`
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
                <span>No Facebook Page or Instagram Account connected yet.</span>
                <a href="/dashboard/accounts" className="font-semibold underline text-amber-900">
                  Connect Account
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
                    {acc.platform === 'INSTAGRAM' ? '📸 Instagram' : '🌐 Facebook'}: {acc.name} ({acc.accountId})
                  </option>
                ))}
              </select>
            )}

            {/* Post Caption */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Post Caption
                </label>
                <span className="text-xs text-slate-400">{content.length} characters</span>
              </div>

              {/* Quick Mention Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-indigo-500" /> Mention:
                </span>
                {AUDIENCE_TAGS.map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => quickInsertMentionToField('content', t.tag)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 text-[11px] font-semibold transition border border-slate-200"
                  >
                    {t.tag}
                  </button>
                ))}
              </div>

              <textarea
                ref={contentRef}
                required
                rows={4}
                value={content}
                onChange={(e) =>
                  handleInputChangeWithMention('content', e.target.value, e.target.selectionStart)
                }
                onKeyUp={(e) =>
                  handleInputChangeWithMention('content', (e.target as any).value, (e.target as any).selectionStart)
                }
                onClick={(e) =>
                  handleInputChangeWithMention('content', (e.target as any).value, (e.target as any).selectionStart)
                }
                placeholder="What would you like to share? Type @ to mention a page, user or audience..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition leading-relaxed"
              />
              {renderMentionDropdown('content')}
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
              <div className="pt-3 border-t border-slate-100 space-y-3 relative">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-indigo-500" /> Tag:
                  </span>
                  {AUDIENCE_TAGS.slice(0, 3).map((t) => (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => quickInsertMentionToField('firstComment', t.tag)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 text-[10px] font-semibold transition border border-slate-200"
                    >
                      {t.tag}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={firstCommentRef}
                  rows={2}
                  value={firstCommentContent}
                  onChange={(e) =>
                    handleInputChangeWithMention('firstComment', e.target.value, e.target.selectionStart)
                  }
                  onKeyUp={(e) =>
                    handleInputChangeWithMention('firstComment', (e.target as any).value, (e.target as any).selectionStart)
                  }
                  onClick={(e) =>
                    handleInputChangeWithMention('firstComment', (e.target as any).value, (e.target as any).selectionStart)
                  }
                  placeholder="👉 Full tutorial & download link: https://example.com (Type @ to mention)"
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                {renderMentionDropdown('firstComment')}

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
              <div className="pt-3 border-t border-slate-100 space-y-2.5 relative">
                {/* Smart Commenter Notification Info */}
                <div className="p-3 rounded-xl bg-violet-50/80 border border-violet-200 flex items-start gap-2.5 text-xs text-violet-900">
                  <Bell className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-violet-950">
                      Smart Commenter Tagging & Instant Notification
                    </p>
                    <p className="text-[11px] text-violet-700 mt-0.5 leading-relaxed">
                      PostCraft will automatically tag the commenter (e.g. <span className="font-bold text-violet-950 bg-white px-1.5 py-0.5 rounded border border-violet-200">@CommenterName</span>) in your reply so Facebook & Instagram trigger an instant push notification on their phone!
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Reply Message Template
                  </label>
                  <button
                    type="button"
                    onClick={() => quickInsertMentionToField('autoReply', '{name}')}
                    className="px-2.5 py-1 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-800 text-[11px] font-bold border border-violet-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    + Insert {'{name}'} Tag
                  </button>
                </div>

                <textarea
                  ref={autoReplyRef}
                  rows={2}
                  value={autoReplyText}
                  onChange={(e) =>
                    handleInputChangeWithMention('autoReply', e.target.value, e.target.selectionStart)
                  }
                  onKeyUp={(e) =>
                    handleInputChangeWithMention('autoReply', (e.target as any).value, (e.target as any).selectionStart)
                  }
                  onClick={(e) =>
                    handleInputChangeWithMention('autoReply', (e.target as any).value, (e.target as any).selectionStart)
                  }
                  placeholder="Hello {name}, thanks for your comment! Check your DM! 🙌 (Type @ to mention)"
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500 text-slate-800"
                />
                {renderMentionDropdown('autoReply')}
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
          {(() => {
            const isInstagram = selectedAccount?.platform === 'INSTAGRAM';

            return (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Live Mockup Preview
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isInstagram
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {isInstagram ? 'Instagram Mobile Feed' : 'Facebook Desktop'}
                  </span>
                </div>

                {isInstagram ? (
                  /* INSTAGRAM CARD MOCKUP */
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-900">
                    {/* IG Header */}
                    <div className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex-shrink-0">
                          <div className="h-full w-full rounded-full bg-white p-[1px] overflow-hidden flex items-center justify-center font-bold text-xs">
                            {selectedAccount?.avatar ? (
                              <img src={selectedAccount.avatar} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                            ) : (
                              <Instagram className="w-4 h-4 text-pink-600" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 leading-tight">
                            {selectedAccount?.name ? selectedAccount.name.replace(/^@/, '') : 'instagram_account'}
                          </p>
                          <p className="text-[10px] text-slate-400">Sponsored · Original audio</p>
                        </div>
                      </div>
                      <button type="button" className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* IG Media Viewport */}
                    <div className="w-full bg-slate-950 aspect-square max-h-96 overflow-hidden flex items-center justify-center relative">
                      {mediaUrl ? (
                        mediaType === 'VIDEO' ? (
                          <video src={mediaUrl} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={mediaUrl} alt="Instagram Post" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="text-center p-6 text-slate-400 space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-pink-400 flex items-center justify-center mx-auto">
                            <Instagram className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-medium text-slate-300">
                            Attach an image or video to preview on Instagram
                          </p>
                          <p className="text-[10px] text-slate-500">
                            (Instagram requires media for all feed posts)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* IG Actions */}
                    <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-slate-800">
                      <div className="flex items-center gap-4">
                        <Heart className="w-5 h-5 hover:text-rose-500 cursor-pointer transition" />
                        <MessageCircle className="w-5 h-5 hover:text-indigo-600 cursor-pointer transition" />
                        <Send className="w-4 h-4 -rotate-45 hover:text-indigo-600 cursor-pointer transition" />
                      </div>
                      <Bookmark className="w-5 h-5 hover:text-slate-950 cursor-pointer transition" />
                    </div>

                    {/* Likes Count */}
                    <div className="px-3.5 pt-1">
                      <p className="text-xs font-bold text-slate-900">1,428 likes</p>
                    </div>

                    {/* IG Caption */}
                    <div className="px-3.5 pt-1.5 pb-2 text-xs text-slate-800 leading-relaxed">
                      <span className="font-bold mr-1.5 text-slate-900">
                        {selectedAccount?.name ? selectedAccount.name.replace(/^@/, '') : 'instagram_account'}
                      </span>
                      <span className="whitespace-pre-wrap">
                        {renderFormattedTextWithMentions(content || 'Your post caption will appear here in real time...', 'INSTAGRAM')}
                      </span>
                    </div>

                    {/* IG First Comment (if enabled) */}
                    {enableFirstComment && firstCommentContent.trim() && (
                      <div className="px-3.5 py-2.5 border-t border-slate-100 bg-pink-50/40 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1 mb-1">
                          <Sparkles className="w-3 h-3" /> Auto First Comment ({firstCommentDelay === 0 ? 'Instant' : `+${firstCommentDelay}m`})
                        </span>
                        <p className="text-slate-800 leading-snug">
                          <span className="font-bold mr-1.5 text-slate-900">
                            {selectedAccount?.name ? selectedAccount.name.replace(/^@/, '') : 'instagram_account'}
                          </span>
                          {renderFormattedTextWithMentions(firstCommentContent, 'INSTAGRAM')}
                        </p>
                      </div>
                    )}

                    {/* View Comments count & Timestamp */}
                    <div className="px-3.5 py-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>View all 24 comments</span>
                      <span>JUST NOW</span>
                    </div>

                    {/* Planned Milestone Triggers Summary */}
                    {enableMilestones && milestones.length > 0 && (
                      <div className="p-3 bg-amber-50/60 border-t border-amber-100 text-[11px] space-y-1">
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <Heart className="w-3 h-3" /> Active Milestone Triggers:
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
                ) : (
                  /* Facebook Card Mockup */
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
                        {renderFormattedTextWithMentions(content || 'Your post caption will appear here in real time...', 'FACEBOOK')}
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
                              {renderFormattedTextWithMentions(firstCommentContent, 'FACEBOOK')}
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
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}