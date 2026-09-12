'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChannelAvatar from '@/components/ChannelAvatar';
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
  Linkedin,
  Facebook,
  Heart,
  Bookmark,
  MoreHorizontal,
  AtSign,
  Users,
  UserCheck,
  Bell,
  BadgeCheck,
  UserPlus,
  RotateCcw,
  Check,
  Layers,
  Edit3,
  Tag,
  FileText,
  Eye,
  FileCode,
  Lock,
  RefreshCw,
  Search,
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  avatar?: string | null;
  accountId: string;
  pageId?: string;
  platform: string;
  category?: string;
}

interface MilestoneInput {
  id: string;
  type: 'LIKES' | 'COMMENTS';
  threshold: number;
  commentText: string;
}

interface ChannelCustomization {
  isCustomized: boolean;
  title?: string;
  content: string;
  categories?: number[];
  tags?: string;
  excerpt?: string;
  wpStatus?: 'publish' | 'future' | 'draft' | 'pending' | 'private';
  mediaUrl: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  enableFirstComment: boolean;
  firstCommentContent: string;
  firstCommentDelay: number;
}

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'MASTER' | string>('MASTER');
  const [composerMode, setComposerMode] = useState<'SOCIAL' | 'WORDPRESS'>('SOCIAL');

  // Master Post States
  const [masterTitle, setMasterTitle] = useState('');
  const [masterContent, setMasterContent] = useState('');
  const [masterCategories, setMasterCategories] = useState<number[]>([]);
  const [masterTags, setMasterTags] = useState('');
  const [masterExcerpt, setMasterExcerpt] = useState('');
  const [masterWpStatus, setMasterWpStatus] = useState<'publish' | 'future' | 'draft' | 'pending' | 'private'>('publish');
  const [masterMediaUrl, setMasterMediaUrl] = useState('');
  const [masterMediaType, setMasterMediaType] = useState<'TEXT' | 'IMAGE' | 'VIDEO'>('TEXT');
  const [masterEnableFirstComment, setMasterEnableFirstComment] = useState(true);
  const [masterFirstCommentContent, setMasterFirstCommentContent] = useState('');
  const [masterFirstCommentDelay, setMasterFirstCommentDelay] = useState<number>(0);

  // WordPress Specific Categories & Inline Editor States
  const [wpCategories, setWpCategories] = useState<Array<{ id: number; name: string; slug: string; count?: number }>>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [loadingWpCategories, setLoadingWpCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editorMode, setEditorMode] = useState<'code' | 'visual'>('code');
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingInline, setUploadingInline] = useState(false);

  // Per-channel Customizations
  const [customizations, setCustomizations] = useState<Record<string, ChannelCustomization>>({});

  // Media upload indicator
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Publishing state
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  // Auto-Reply state (Smart Commenter Tagging)
  const [enableAutoReply, setEnableAutoReply] = useState(false);
  const [autoReplyText, setAutoReplyText] = useState(
    'Thanks for checking this out! Send us a DM or visit our page for more details! 🙌'
  );

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

  // Preview target state when in Master tab
  const [previewAccountId, setPreviewAccountId] = useState<string>('');

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

  interface MentionProfile {
    id: string;
    tag: string;
    name: string;
    subtitle: string;
    avatar?: string;
    verified?: boolean;
    platform: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'ALL';
    type: 'profile' | 'page' | 'company' | 'audience' | 'custom';
    followers?: string;
    bio?: string;
    postsCount?: string;
    followingCount?: string;
    headline?: string;
    connections?: string;
  }

  const DEFAULT_PROFILES: MentionProfile[] = [
    // Facebook Profiles & Pages
    {
      id: 'fb_1',
      tag: '@MarkZuckerberg',
      name: 'Mark Zuckerberg',
      subtitle: 'Founder & CEO at Meta · 119M followers',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      verified: true,
      platform: 'FACEBOOK',
      type: 'profile',
      followers: '119M followers',
      bio: 'Founder and CEO at Meta. Building technology that brings people together.',
    },
    {
      id: 'fb_2',
      tag: '@TanvirAhmed',
      name: 'Tanvir Ahmed',
      subtitle: 'Friend · 14 mutual friends',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      verified: false,
      platform: 'FACEBOOK',
      type: 'profile',
      followers: '3.4K followers',
      bio: 'Software engineer & digital creator based in Dhaka, Bangladesh.',
    },
    {
      id: 'fb_3',
      tag: '@NusratJahan',
      name: 'Nusrat Jahan',
      subtitle: 'Digital Creator · Followed by 24K',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      verified: true,
      platform: 'FACEBOOK',
      type: 'profile',
      followers: '24K followers',
      bio: 'Lifestyle & design creator sharing tips for creators ✨',
    },
    {
      id: 'fb_4',
      tag: '@TechNewsDaily',
      name: 'Tech News Daily',
      subtitle: 'Media / News Page · 480K followers',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      verified: true,
      platform: 'FACEBOOK',
      type: 'page',
      followers: '480K followers',
      bio: 'Breaking tech news, product reviews, and gadget launches ⚡',
    },

    // Instagram Profiles & Creators
    {
      id: 'ig_1',
      tag: '@cristiano',
      name: 'Cristiano Ronaldo',
      subtitle: 'Athlete · 630M followers',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      verified: true,
      platform: 'INSTAGRAM',
      type: 'profile',
      followers: '630M followers',
      postsCount: '3,712',
      followingCount: '580',
      bio: 'SIUUU! Join my journey. Football, family, and hard work ⚽',
    },
    {
      id: 'ig_2',
      tag: '@postcraft.official',
      name: 'PostCraft App',
      subtitle: 'Software & Technology · Verified',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      verified: true,
      platform: 'INSTAGRAM',
      type: 'page',
      followers: '52.4K followers',
      postsCount: '248',
      followingCount: '92',
      bio: 'AI-Powered Social Media Management Suite for Growth 🚀',
    },
    {
      id: 'ig_3',
      tag: '@sarah_designs',
      name: 'Sarah Jenkins',
      subtitle: 'Visual Artist · 98K followers',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      verified: true,
      platform: 'INSTAGRAM',
      type: 'profile',
      followers: '98K followers',
      postsCount: '419',
      followingCount: '310',
      bio: 'Crafting minimalist aesthetics & digital brand identities ✨',
    },
    {
      id: 'ig_4',
      tag: '@tech_insider',
      name: 'Tech Insider',
      subtitle: 'Science & Technology · 1.2M followers',
      avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150',
      verified: true,
      platform: 'INSTAGRAM',
      type: 'page',
      followers: '1.2M followers',
      postsCount: '1,890',
      followingCount: '42',
      bio: 'Exploring future tech, robotics, AI, and futuristic gadgets 🤖',
    },

    // LinkedIn Members & Companies
    {
      id: 'li_1',
      tag: '@SatyaNadella',
      name: 'Satya Nadella',
      subtitle: 'Chairman and CEO at Microsoft · 10M followers',
      headline: 'Chairman and CEO at Microsoft',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      verified: true,
      platform: 'LINKEDIN',
      type: 'profile',
      followers: '10.2M followers',
      connections: '1st',
      bio: 'Chairman and CEO at Microsoft. Empowering every person and organization on the planet to achieve more.',
    },
    {
      id: 'li_2',
      tag: '@BillGates',
      name: 'Bill Gates',
      subtitle: 'Co-chair, Bill & Melinda Gates Foundation · 36M followers',
      headline: 'Co-chair, Bill & Melinda Gates Foundation',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      verified: true,
      platform: 'LINKEDIN',
      type: 'profile',
      followers: '36.5M followers',
      connections: '2nd',
      bio: 'Co-chair of the Bill & Melinda Gates Foundation. Passionate about global health, education, and climate innovation.',
    },
    {
      id: 'li_3',
      tag: '@AlaminDev',
      name: 'Alamin Developer',
      subtitle: 'Full Stack AI Engineer & Creator of PostCraft · 12K followers',
      headline: 'Full Stack AI Engineer | PostCraft Architect',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      verified: true,
      platform: 'LINKEDIN',
      type: 'profile',
      followers: '12.4K followers',
      connections: '1st',
      bio: 'Building enterprise social automation systems, Next.js web applications, and AI workflows.',
    },
    {
      id: 'li_4',
      tag: '@Microsoft',
      name: 'Microsoft',
      subtitle: 'Computer Software · Redmond, WA · 21M followers',
      headline: 'Software Development & Cloud Computing',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      verified: true,
      platform: 'LINKEDIN',
      type: 'company',
      followers: '21.8M followers',
      bio: 'Our mission is to empower every person and every organization on the planet to achieve more.',
    },

    // Broadcast Audience Tags
    {
      id: 'aud_1',
      tag: '@everyone',
      name: '@everyone',
      subtitle: 'Notify all group members or page followers',
      platform: 'ALL',
      type: 'audience',
      bio: 'Sends a priority notification badge to all active members',
    },
    {
      id: 'aud_2',
      tag: '@followers',
      name: '@followers',
      subtitle: 'Send direct notification to all active followers',
      platform: 'ALL',
      type: 'audience',
      bio: 'Reaches your follower base directly in their feed',
    },
    {
      id: 'aud_3',
      tag: '@topfans',
      name: '@topfans',
      subtitle: 'Acknowledge and reward Top Fan badge holders',
      platform: 'ALL',
      type: 'audience',
      bio: 'Mentions and rewards the highest engaging community fans',
    },
    {
      id: 'aud_4',
      tag: '@highlights',
      name: '@highlights',
      subtitle: 'Highlight post in friends & followers notification feed',
      platform: 'ALL',
      type: 'audience',
      bio: 'Highlights update in newsfeed recommendation queue',
    },
  ];

  const AUDIENCE_TAGS = [
    { tag: '@everyone', name: 'Everyone', desc: 'Notify everyone in group or followers', type: 'audience' },
    { tag: '@followers', name: 'Followers', desc: 'Notify all active followers of the page', type: 'audience' },
    { tag: '@topfans', name: 'Top Fans', desc: 'Mention and notify your top fans', type: 'audience' },
    { tag: '@highlights', name: 'Highlights', desc: 'Highlight update in followers feed', type: 'audience' },
  ];

  const [hoveredProfileData, setHoveredProfileData] = useState<{
    profile: MentionProfile;
    platform: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN';
    rect: { top: number; left: number };
  } | null>(null);

  // Active Tab & Customization Helpers
  const wpAccounts = accounts.filter((a) => a.platform === 'WORDPRESS');
  const socialAccounts = accounts.filter((a) => a.platform !== 'WORDPRESS');

  const isMaster = activeTab === 'MASTER';
  const activeAccount = accounts.find((a) => a.id === activeTab) || null;

  const isWordPressActive = composerMode === 'WORDPRESS';

  const switchToMode = (mode: 'SOCIAL' | 'WORDPRESS') => {
    setComposerMode(mode);
    setError(null);
    setSuccess(null);
    if (mode === 'WORDPRESS') {
      const wpAcc = accounts.find((a) => a.platform === 'WORDPRESS');
      if (wpAcc) {
        setSelectedAccountIds([wpAcc.id]);
        setActiveTab(wpAcc.id);
        setPreviewAccountId(wpAcc.id);
        fetchWpCategories(wpAcc.id);
      }
    } else {
      const socialAccs = accounts.filter((a) => a.platform !== 'WORDPRESS');
      if (socialAccs.length > 0) {
        const ids = socialAccs.map((a) => a.id);
        setSelectedAccountIds(ids);
        setActiveTab('MASTER');
        setPreviewAccountId(ids[0]);
      }
    }
  };

  const getEffectiveChannelData = (accId: string): ChannelCustomization => {
    const custom = customizations[accId];
    if (custom && custom.isCustomized) {
      return custom;
    }
    return {
      isCustomized: false,
      title: masterTitle,
      content: masterContent,
      categories: masterCategories,
      tags: masterTags,
      excerpt: masterExcerpt,
      wpStatus: masterWpStatus,
      mediaUrl: masterMediaUrl,
      mediaType: masterMediaType,
      enableFirstComment: masterEnableFirstComment,
      firstCommentContent: masterFirstCommentContent,
      firstCommentDelay: masterFirstCommentDelay,
    };
  };

  // Current values based on active tab
  const currentTitle = isMaster
    ? masterTitle
    : (customizations[activeTab]?.isCustomized && customizations[activeTab].title !== undefined
        ? customizations[activeTab].title || ''
        : masterTitle);

  const currentContent = isMaster
    ? masterContent
    : (customizations[activeTab]?.isCustomized ? customizations[activeTab].content : masterContent);

  const currentCategories = isMaster
    ? masterCategories
    : (customizations[activeTab]?.isCustomized && customizations[activeTab].categories !== undefined
        ? customizations[activeTab].categories || []
        : masterCategories);

  const currentTags = isMaster
    ? masterTags
    : (customizations[activeTab]?.isCustomized && customizations[activeTab].tags !== undefined
        ? customizations[activeTab].tags || ''
        : masterTags);

  const currentExcerpt = isMaster
    ? masterExcerpt
    : (customizations[activeTab]?.isCustomized && customizations[activeTab].excerpt !== undefined
        ? customizations[activeTab].excerpt || ''
        : masterExcerpt);

  const currentWpStatus = isMaster
    ? masterWpStatus
    : (customizations[activeTab]?.isCustomized && customizations[activeTab].wpStatus !== undefined
        ? customizations[activeTab].wpStatus || 'publish'
        : masterWpStatus);

  const currentMediaUrl = isMaster
    ? masterMediaUrl
    : (customizations[activeTab]?.isCustomized ? customizations[activeTab].mediaUrl : masterMediaUrl);

  const currentMediaType = isMaster
    ? masterMediaType
    : (customizations[activeTab]?.isCustomized ? customizations[activeTab].mediaType : masterMediaType);

  const currentEnableFirstComment = isMaster
    ? masterEnableFirstComment
    : (customizations[activeTab]?.isCustomized ? customizations[activeTab].enableFirstComment : masterEnableFirstComment);

  const currentFirstCommentContent = isMaster
    ? masterFirstCommentContent
    : (customizations[activeTab]?.isCustomized ? customizations[activeTab].firstCommentContent : masterFirstCommentContent);

  const currentFirstCommentDelay = isMaster
    ? masterFirstCommentDelay
    : (customizations[activeTab]?.isCustomized ? customizations[activeTab].firstCommentDelay : masterFirstCommentDelay);

  // Updaters for active content
  const updateActiveTitle = (val: string) => {
    if (isMaster) {
      setMasterTitle(val);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            title: val,
            isCustomized: true,
          },
        };
      });
    }
  };

  const updateActiveCategories = (cats: number[]) => {
    if (isMaster) {
      setMasterCategories(cats);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            categories: cats,
            isCustomized: true,
          },
        };
      });
    }
  };

  const updateActiveTags = (val: string) => {
    if (isMaster) {
      setMasterTags(val);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            tags: val,
            isCustomized: true,
          },
        };
      });
    }
  };

  const updateActiveExcerpt = (val: string) => {
    if (isMaster) {
      setMasterExcerpt(val);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            excerpt: val,
            isCustomized: true,
          },
        };
      });
    }
  };

  const updateActiveWpStatus = (status: 'publish' | 'future' | 'draft' | 'pending' | 'private') => {
    if (isMaster) {
      setMasterWpStatus(status);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            wpStatus: status,
            isCustomized: true,
          },
        };
      });
    }
  };

  const insertHtmlTag = (openTag: string, closeTag: string, defaultText = '') => {
    const textarea = contentRef.current;
    const start = textarea ? textarea.selectionStart || 0 : currentContent.length;
    const end = textarea ? textarea.selectionEnd || 0 : currentContent.length;
    const selectedText = currentContent.substring(start, end) || defaultText;
    const replacement = `${openTag}${selectedText}${closeTag}`;
    const newText = currentContent.substring(0, start) + replacement + currentContent.substring(end);
    updateActiveContent(newText);
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
      }
    }, 50);
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInline(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const textarea = contentRef.current;
        const cursor = textarea ? textarea.selectionStart || currentContent.length : currentContent.length;
        const imgTag = `\n<img src="${data.url}" alt="${file.name.replace(/\.[^/.]+$/, '')}" class="rounded-xl my-4 max-w-full h-auto shadow-md" />\n`;
        const newText = currentContent.substring(0, cursor) + imgTag + currentContent.substring(cursor);
        updateActiveContent(newText);
      } else {
        alert(data.error || 'Failed to upload inline image');
      }
    } catch (err: any) {
      alert(err?.message || 'Error uploading inline image');
    } finally {
      setUploadingInline(false);
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = '';
    }
  };

  const updateActiveContent = (val: string) => {
    if (isMaster) {
      setMasterContent(val);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            content: val,
            isCustomized: true,
          },
        };
      });
    }
  };

  const updateActiveMedia = (url: string, type: 'TEXT' | 'IMAGE' | 'VIDEO') => {
    if (isMaster) {
      setMasterMediaUrl(url);
      setMasterMediaType(type);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            mediaUrl: url,
            mediaType: type,
            isCustomized: true,
          },
        };
      });
    }
  };

  const removeActiveMedia = () => {
    updateActiveMedia('', 'TEXT');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateActiveFirstCommentEnabled = (enabled: boolean) => {
    if (isMaster) {
      setMasterEnableFirstComment(enabled);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            enableFirstComment: enabled,
            isCustomized: true,
          },
        };
      });
    }
  };

  const updateActiveFirstCommentContent = (val: string) => {
    if (isMaster) {
      setMasterFirstCommentContent(val);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            firstCommentContent: val,
            isCustomized: true,
          },
        };
      });
    }
  };

  const updateActiveFirstCommentDelay = (delay: number) => {
    if (isMaster) {
      setMasterFirstCommentDelay(delay);
    } else {
      setCustomizations((prev) => {
        const existing = prev[activeTab] || getEffectiveChannelData(activeTab);
        return {
          ...prev,
          [activeTab]: {
            ...existing,
            firstCommentDelay: delay,
            isCustomized: true,
          },
        };
      });
    }
  };

  const resetChannelToMaster = (accId: string) => {
    setCustomizations((prev) => ({
      ...prev,
      [accId]: {
        isCustomized: false,
        title: masterTitle,
        content: masterContent,
        categories: masterCategories,
        tags: masterTags,
        excerpt: masterExcerpt,
        wpStatus: masterWpStatus,
        mediaUrl: masterMediaUrl,
        mediaType: masterMediaType,
        enableFirstComment: masterEnableFirstComment,
        firstCommentContent: masterFirstCommentContent,
        firstCommentDelay: masterFirstCommentDelay,
      },
    }));
  };

  const handleInputChangeWithMention = (
    field: 'content' | 'firstComment' | 'autoReply',
    val: string,
    cursorPos: number
  ) => {
    if (field === 'content') updateActiveContent(val);
    else if (field === 'firstComment') updateActiveFirstCommentContent(val);
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
        ? currentContent
        : targetField === 'firstComment'
        ? currentFirstCommentContent
        : autoReplyText;

    const startIndex = cursorIndex - query.length - 1;
    const before = currentVal.slice(0, Math.max(0, startIndex));
    const after = currentVal.slice(cursorIndex);
    const tagWithPrefix = mentionTag.startsWith('@') || mentionTag.startsWith('{') ? mentionTag : `@${mentionTag}`;
    const newVal = `${before}${tagWithPrefix} ${after}`;
    const newCursorPos = before.length + tagWithPrefix.length + 1;

    if (targetField === 'content') {
      updateActiveContent(newVal);
      setTimeout(() => {
        contentRef.current?.focus();
        contentRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    } else if (targetField === 'firstComment') {
      updateActiveFirstCommentContent(newVal);
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
      updateActiveContent(`${currentContent ? currentContent + ' ' : ''}${tagToInsert}`);
      contentRef.current?.focus();
    } else if (field === 'firstComment') {
      updateActiveFirstCommentContent(`${currentFirstCommentContent ? currentFirstCommentContent + ' ' : ''}${tagToInsert}`);
      firstCommentRef.current?.focus();
    } else if (field === 'autoReply') {
      setAutoReplyText((prev) => `${prev ? prev + ' ' : ''}${tagToInsert}`);
      autoReplyRef.current?.focus();
    }
  };

  // Filter mention suggestions based on active context
  const getFilteredSuggestions = (): MentionProfile[] => {
    const currentPlatform = activeAccount?.platform || 'FACEBOOK';
    const isLinkedIn = currentPlatform === 'LINKEDIN';
    const isInstagram = currentPlatform === 'INSTAGRAM';
    const q = mentionState.query.toLowerCase();

    // 1. Dynamic accounts connected by user
    const userConnectedAccounts: MentionProfile[] = accounts.map((acc) => {
      const cleanHandle = acc.name.replace(/^@/, '').replace(/\s+/g, '');
      return {
        id: `acc_${acc.id}`,
        tag: `@${cleanHandle}`,
        name: acc.name,
        subtitle: `Your Connected ${acc.platform === 'LINKEDIN' ? 'LinkedIn' : acc.platform === 'INSTAGRAM' ? 'Instagram' : 'Facebook'} Account`,
        avatar: acc.avatar || undefined,
        verified: true,
        platform: acc.platform as any,
        type: 'page',
        followers: 'Active Page',
        bio: `Connected account on PostCraft`,
      };
    });

    // 2. Filter default profiles matching current platform
    const platformProfiles = DEFAULT_PROFILES.filter((p) => {
      if (p.platform === 'ALL') return true;
      if (isLinkedIn) return p.platform === 'LINKEDIN';
      if (isInstagram) return p.platform === 'INSTAGRAM';
      return p.platform === 'FACEBOOK';
    });

    const allProfiles = [...userConnectedAccounts, ...platformProfiles];

    let list = allProfiles;
    if (q) {
      list = allProfiles.filter(
        (p) =>
          p.tag.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q)
      );

      if (!list.some((p) => p.tag.toLowerCase() === `@${q}`)) {
        list.push({
          id: 'custom_search',
          tag: `@${q}`,
          name: q,
          subtitle: `Tag @${q} on ${isLinkedIn ? 'LinkedIn' : isInstagram ? 'Instagram' : 'Facebook'}`,
          platform: isLinkedIn ? 'LINKEDIN' : isInstagram ? 'INSTAGRAM' : 'FACEBOOK',
          type: 'custom',
        });
      }
    }

    return list;
  };

  const findProfileByTag = (tag: string, platform: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN'): MentionProfile => {
    const cleanTag = tag.trim().toLowerCase();
    const suggestions = getFilteredSuggestions();
    const found = suggestions.find((s) => s.tag.toLowerCase() === cleanTag);
    if (found) return found;

    const rawName = tag.replace(/^@/, '');
    return {
      id: `dynamic_${rawName}`,
      tag: tag.startsWith('@') ? tag : `@${tag}`,
      name: rawName,
      subtitle:
        platform === 'LINKEDIN'
          ? 'LinkedIn Member · 500+ connections'
          : platform === 'INSTAGRAM'
          ? 'Instagram User · Followed by friends'
          : 'Facebook Profile · Active Now',
      headline: platform === 'LINKEDIN' ? 'Industry Professional · Network Member' : undefined,
      connections: platform === 'LINKEDIN' ? '1st' : undefined,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      verified: false,
      platform,
      type: 'profile',
      followers: '1.5K followers',
      bio: `${tag} active on ${platform === 'LINKEDIN' ? 'LinkedIn' : platform === 'INSTAGRAM' ? 'Instagram' : 'Facebook'}`,
      postsCount: '84',
      followingCount: '210',
    };
  };

  const renderFormattedTextWithMentions = (
    text: string,
    platform: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' = 'FACEBOOK'
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
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredProfileData({
                profile: findProfileByTag(part, platform),
                platform,
                rect: { top: rect.top, left: rect.left },
              });
            }}
            onMouseLeave={() => setHoveredProfileData(null)}
            className={`font-semibold cursor-pointer transition inline-block ${
              platform === 'LINKEDIN'
                ? 'text-[#0A66C2] hover:text-[#004182] bg-blue-50/70 hover:bg-blue-100 px-1 py-0.2 rounded'
                : platform === 'INSTAGRAM'
                ? 'text-sky-600 hover:text-sky-700 bg-sky-50/70 hover:bg-sky-100 px-1 py-0.2 rounded'
                : 'text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100 px-1 py-0.2 rounded'
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
    const currentPlatform = activeAccount?.platform || 'FACEBOOK';
    const isLinkedIn = currentPlatform === 'LINKEDIN';
    const isInstagram = currentPlatform === 'INSTAGRAM';
    const suggestions = getFilteredSuggestions();

    return (
      <div className="absolute left-0 right-0 z-30 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
        <div
          className={`p-3 border-b flex items-center justify-between ${
            isLinkedIn
              ? 'bg-blue-50/80 border-blue-200'
              : isInstagram
              ? 'bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-600/10 border-pink-100'
              : 'bg-blue-50/70 border-blue-100'
          }`}
        >
          <div className="flex items-center gap-2">
            {isLinkedIn ? (
              <span className="p-1.5 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center shadow-xs">
                <Linkedin className="w-3.5 h-3.5" />
              </span>
            ) : isInstagram ? (
              <span className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <Instagram className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="p-1.5 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Globe className="w-3.5 h-3.5" />
              </span>
            )}
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {isLinkedIn
                  ? 'LinkedIn Members & Companies'
                  : isInstagram
                  ? 'Instagram Profiles & Creators'
                  : 'Facebook Profiles & Pages'}
              </p>
              <p className="text-[10px] text-slate-500">
                {isLinkedIn
                  ? 'Mentioning tags professionals and sends network notifications'
                  : isInstagram
                  ? 'Tagging sends direct notification to users'
                  : 'Mentioning tags profiles and notifies them'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMentionState((prev) => ({ ...prev, isOpen: false }))}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
          {suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching profiles or pages found
            </div>
          ) : (
            suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(item.tag);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition group cursor-pointer ${
                  isLinkedIn
                    ? 'hover:bg-blue-50/60'
                    : isInstagram
                    ? 'hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50'
                    : 'hover:bg-[#F0F2F5]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:scale-105 transition"
                    />
                    {item.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                        <BadgeCheck
                          className={`w-3.5 h-3.5 ${
                            isLinkedIn
                              ? 'text-[#0A66C2] fill-[#0A66C2] text-white'
                              : isInstagram
                              ? 'text-sky-500 fill-sky-500 text-white'
                              : 'text-blue-600 fill-blue-600 text-white'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition truncate">
                        {item.name}
                      </p>
                      {item.verified && (
                        <BadgeCheck
                          className={`w-3 h-3 flex-shrink-0 ${
                            isLinkedIn
                              ? 'text-[#0A66C2] fill-[#0A66C2] text-white'
                              : isInstagram
                              ? 'text-sky-500 fill-sky-500 text-white'
                              : 'text-blue-600 fill-blue-600 text-white'
                          }`}
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {isLinkedIn && item.headline ? item.headline : isInstagram ? item.name : item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                    {item.tag}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                      isLinkedIn
                        ? 'bg-blue-100 text-[#0A66C2] group-hover:bg-[#0A66C2] group-hover:text-white'
                        : isInstagram
                        ? 'bg-pink-100 text-pink-700 group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-600 group-hover:text-white'
                        : 'bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white'
                    }`}
                  >
                    Tag
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  // Load accounts on mount
  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts && data.accounts.length > 0) {
          setAccounts(data.accounts);
          const socialAccs = data.accounts.filter((a: Account) => a.platform !== 'WORDPRESS');
          const wpAccs = data.accounts.filter((a: Account) => a.platform === 'WORDPRESS');

          const paramMode = searchParams.get('mode') || searchParams.get('platform');
          if (paramMode?.toLowerCase() === 'wordpress' || (socialAccs.length === 0 && wpAccs.length > 0)) {
            setComposerMode('WORDPRESS');
            if (wpAccs.length > 0) {
              setSelectedAccountIds([wpAccs[0].id]);
              setActiveTab(wpAccs[0].id);
              setPreviewAccountId(wpAccs[0].id);
              fetchWpCategories(wpAccs[0].id);
            }
          } else {
            setComposerMode('SOCIAL');
            if (socialAccs.length > 0) {
              const socialIds = socialAccs.map((a: Account) => a.id);
              setSelectedAccountIds(socialIds);
              setActiveTab('MASTER');
              setPreviewAccountId(socialIds[0]);
            } else if (wpAccs.length > 0) {
              setComposerMode('WORDPRESS');
              setSelectedAccountIds([wpAccs[0].id]);
              setActiveTab(wpAccs[0].id);
              setPreviewAccountId(wpAccs[0].id);
              fetchWpCategories(wpAccs[0].id);
            }
          }
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

  // Load WordPress categories when WordPress accounts are selected
  const fetchWpCategories = async (accountId?: string) => {
    setLoadingWpCategories(true);
    try {
      const url = accountId ? `/api/wordpress/categories?accountId=${accountId}` : '/api/wordpress/categories';
      const res = await fetch(url);
      const data = await res.json();
      if (data.categories && data.categories.length > 0) {
        setWpCategories(data.categories);
        setMasterCategories((prev) => (prev.length === 0 ? [data.categories[0].id] : prev));
      }
    } catch (err) {
      console.error('Failed to load WordPress categories:', err);
    } finally {
      setLoadingWpCategories(false);
    }
  };

  useEffect(() => {
    const wpAcc =
      accounts.find(
        (a) => (isMaster ? selectedAccountIds.includes(a.id) : a.id === activeTab) && a.platform === 'WORDPRESS'
      ) || accounts.find((a) => a.platform === 'WORDPRESS');

    if (wpAcc) {
      fetchWpCategories(wpAcc.id);
    }
  }, [accounts, selectedAccountIds, activeTab, isMaster]);

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

      updateActiveMedia(data.url, data.mediaType);
    } catch (err: any) {
      setError(err?.message || 'Network error during upload');
    } finally {
      setUploadingMedia(false);
    }
  };

  // Toggle account selection
  const toggleAccountSelection = (accId: string) => {
    setSelectedAccountIds((prev) => {
      let next: string[];
      if (prev.includes(accId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        next = prev.filter((id) => id !== accId);
        if (activeTab === accId) {
          setActiveTab('MASTER');
        }
      } else {
        next = [...prev, accId];
      }
      return next;
    });
  };

  const selectAllAccounts = () => {
    setSelectedAccountIds(accounts.map((a) => a.id));
  };

  const clearAccountSelection = () => {
    if (accounts.length > 0) {
      setSelectedAccountIds([accounts[0].id]);
      setActiveTab('MASTER');
    }
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

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const isWpMode = composerMode === 'WORDPRESS';
    const targetAccountIds = isWpMode
      ? accounts.filter((a) => a.platform === 'WORDPRESS').map((a) => a.id)
      : selectedAccountIds.filter((id) => accounts.find((a) => a.id === id)?.platform !== 'WORDPRESS');

    if (targetAccountIds.length === 0) {
      setError(
        isWpMode
          ? 'কোনো ওয়ার্ডপ্রেস অ্যাকাউন্ট যুক্ত নেই। অনুগ্রহ করে Accounts মেনু থেকে সাইট কানেক্ট করুন।'
          : 'Please select at least one social channel to publish to.'
      );
      return;
    }

    if (isWpMode) {
      if (!currentTitle || !currentTitle.trim()) {
        setError('ওয়ার্ডপ্রেস পোস্টের জন্য আর্টিকেলের শিরোনাম (Article Title) আবশ্যক।');
        return;
      }
      if (!currentContent || !currentContent.trim()) {
        setError('ওয়ার্ডপ্রেস পোস্টের জন্য আর্টিকেলের মূল কন্টেন্ট (Article Body) আবশ্যক।');
        return;
      }
    } else {
      // Check Instagram & Social caption requirements
      for (const accId of targetAccountIds) {
        const acc = accounts.find((a) => a.id === accId);
        if (acc?.platform === 'INSTAGRAM') {
          const eff = getEffectiveChannelData(accId);
          if (!eff.mediaUrl) {
            setError(
              `Instagram account "${acc.name}" requires an image or video attachment. Please attach media.`
            );
            return;
          }
        }
        const eff = getEffectiveChannelData(accId);
        if (!eff.content.trim()) {
          setError(`Post caption for "${acc?.name || 'Selected account'}" cannot be empty.`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Build customizations payload for social accounts with custom edits
      const customPayload: Record<string, any> = {};
      if (!isWpMode) {
        targetAccountIds.forEach((accId) => {
          const c = customizations[accId];
          if (c && c.isCustomized) {
            customPayload[accId] = {
              isCustomized: true,
              content: c.content.trim(),
              mediaUrl: c.mediaUrl.trim() || undefined,
              mediaType: c.mediaType,
              autoComment:
                c.enableFirstComment && c.firstCommentContent.trim()
                  ? {
                      enabled: true,
                      content: c.firstCommentContent.trim(),
                      delayMinutes: c.firstCommentDelay,
                    }
                  : undefined,
            };
          }
        });
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: targetAccountIds,
          content: currentContent.trim(),
          title: isWpMode ? currentTitle.trim() : undefined,
          categories: isWpMode ? currentCategories : undefined,
          tags: isWpMode ? currentTags : undefined,
          excerpt: isWpMode ? currentExcerpt.trim() : undefined,
          wpStatus: isWpMode ? currentWpStatus : undefined,
          mediaUrl: currentMediaUrl.trim() || undefined,
          mediaType: currentMediaType,
          publishNow: publishMode === 'now',
          scheduledAt: publishMode === 'schedule' ? scheduledAt : undefined,
          autoComment:
            !isWpMode && masterEnableFirstComment && masterFirstCommentContent.trim()
              ? {
                  enabled: true,
                  content: masterFirstCommentContent.trim(),
                  delayMinutes: masterFirstCommentDelay,
                }
              : undefined,
          autoReply:
            !isWpMode && enableAutoReply && autoReplyText.trim()
              ? {
                  isEnabled: true,
                  replyText: autoReplyText.trim(),
                }
              : undefined,
          milestoneTriggers: !isWpMode && enableMilestones ? milestones : [],
          customizations: customPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit post');
        return;
      }

      setSuccess(
        isWpMode
          ? publishMode === 'now'
            ? 'ওয়ার্ডপ্রেসে পোস্ট সফলভাবে প্রকাশিত হয়েছে!'
            : 'ওয়ার্ডপ্রেস পোস্ট সফলভাবে ক্যালেন্ডারে শিডিউল হয়েছে!'
          : publishMode === 'now'
          ? `Successfully published to ${targetAccountIds.length} channel${targetAccountIds.length > 1 ? 's' : ''}!`
          : `Post scheduled across ${targetAccountIds.length} channel${targetAccountIds.length > 1 ? 's' : ''} successfully!`
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

  // Preview account determination
  const isPreviewWordPress = composerMode === 'WORDPRESS';
  const previewAccount = isPreviewWordPress
    ? wpAccounts[0] || accounts.find((a) => a.platform === 'WORDPRESS') || accounts[0]
    : isMaster
    ? socialAccounts.find((a) => a.id === previewAccountId) ||
      socialAccounts.find((a) => selectedAccountIds.includes(a.id)) ||
      socialAccounts[0] ||
      accounts[0]
    : activeAccount;

  const previewData = previewAccount ? getEffectiveChannelData(previewAccount.id) : null;
  const previewPlatform = previewAccount?.platform || (isPreviewWordPress ? 'WORDPRESS' : 'FACEBOOK');
  const isPreviewLinkedIn = !isPreviewWordPress && previewPlatform === 'LINKEDIN';
  const isPreviewInstagram = !isPreviewWordPress && previewPlatform === 'INSTAGRAM';

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Post Composer Studio</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select multiple channels to design posts all at once, customize per channel, and publish seamlessly.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-sm text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* TOP POST TYPE SELECTOR (Social Media vs WordPress) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => switchToMode('SOCIAL')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              composerMode === 'SOCIAL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>সোশ্যাল মিডিয়া পোস্ট (Social Media)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                composerMode === 'SOCIAL' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              Facebook • Instagram • LinkedIn
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchToMode('WORDPRESS')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              composerMode === 'WORDPRESS'
                ? 'bg-[#21759B] text-white shadow-md shadow-blue-100'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>ওয়ার্ডপ্রেস আর্টিকেল (WordPress Blog Article)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                composerMode === 'WORDPRESS' ? 'bg-[#1a5f7e] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              H1, H2, ক্যাটাগরি, ফিচারড ইমেজ
            </span>
          </button>
        </div>

        {composerMode === 'WORDPRESS' && wpAccounts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#21759B] font-semibold">
            <Globe className="w-3.5 h-3.5" />
            <span>সাইট: {wpAccounts[0].name} ({wpAccounts[0].pageId || wpAccounts[0].accountId})</span>
          </div>
        )}
      </div>

      {/* SOCIAL MEDIA CHANNELS SELECTOR BAR */}
      {composerMode === 'SOCIAL' && (
        <>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select Channels to Publish
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                  {selectedAccountIds.filter((id) => socialAccounts.some((a) => a.id === id)).length} of {socialAccounts.length} Selected
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedAccountIds(socialAccounts.map((a) => a.id))}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition px-2 py-1 rounded-md hover:bg-indigo-50 cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (socialAccounts.length > 0) {
                      setSelectedAccountIds([socialAccounts[0].id]);
                      setActiveTab('MASTER');
                    }
                  }}
                  className="font-medium text-slate-500 hover:text-slate-700 transition px-2 py-1 rounded-md hover:bg-slate-100 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {socialAccounts.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span>No Facebook, Instagram, or LinkedIn account connected yet.</span>
                <a href="/dashboard/accounts" className="font-semibold underline text-amber-900">
                  Connect Account
                </a>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {socialAccounts.map((acc) => {
                  const isSelected = selectedAccountIds.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => toggleAccountSelection(acc.id)}
                      className={`group relative flex items-center gap-3 p-2 pr-3.5 rounded-2xl border transition text-left cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="relative">
                        <ChannelAvatar
                          avatar={acc.avatar}
                          name={acc.name}
                          platform={acc.platform}
                          size="md"
                        />
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs border-2 border-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate max-w-[130px] ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                          {acc.name}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize truncate">
                          {acc.category?.toLowerCase().includes('profile') ? '👤 Profile' : '🏢 Page'} • {acc.platform.toLowerCase()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* DUAL-LEVEL EDITOR TABS: Master Tab & Per-Channel Customization Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('MASTER')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                isMaster
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Selected Channels</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isMaster ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {selectedAccountIds.filter((id) => socialAccounts.some((a) => a.id === id)).length}
              </span>
            </button>

            {selectedAccountIds
              .filter((id) => socialAccounts.some((a) => a.id === id))
              .map((accId) => {
                const acc = accounts.find((a) => a.id === accId);
                if (!acc) return null;
                const isActive = activeTab === accId;
                const isCustom = !!customizations[accId]?.isCustomized;

                return (
                  <button
                    key={accId}
                    type="button"
                    onClick={() => setActiveTab(accId)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex-shrink-0 cursor-pointer border ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
                    }`}
                  >
                    <ChannelAvatar
                      avatar={acc.avatar}
                      name={acc.name}
                      platform={acc.platform}
                      size="xs"
                      showBadge={true}
                    />
                    <span className="truncate max-w-[120px]">{acc.name}</span>
                    {isCustom && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Customized
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </>
      )}

      {/* WORDPRESS SITE HEADER BAR */}
      {composerMode === 'WORDPRESS' && (
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#21759B] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {wpAccounts[0]?.name || 'WordPress Website'}
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {wpAccounts[0]?.pageId || wpAccounts[0]?.accountId || 'https://yourwebsite.com'} • WordPress REST API Connected
              </p>
            </div>
          </div>

          {wpAccounts.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Select Site:</span>
              <select
                value={selectedAccountIds[0] || ''}
                onChange={(e) => {
                  setSelectedAccountIds([e.target.value]);
                  setActiveTab(e.target.value);
                  setPreviewAccountId(e.target.value);
                  fetchWpCategories(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium bg-white"
              >
                {wpAccounts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.pageId || w.accountId})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Composer Form (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {composerMode === 'WORDPRESS' ? (
            /* ===================== WORDPRESS DEDICATED COMPOSER ===================== */
            <div className="space-y-6">
              {/* 1. Article Title Box (H1) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#21759B]" /> আর্টিকেল শিরোনাম / Title (H1) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[#21759B] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    WordPress H1 Heading
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={currentTitle}
                  onChange={(e) => updateActiveTitle(e.target.value)}
                  placeholder="যেমন: ১০টি সেরা ওয়ার্ডপ্রেস এসইও প্লাগইন যা আপনার সাইটের ট্রাফিক বাড়াবে..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#21759B] text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition placeholder:font-normal placeholder:text-slate-400"
                />
              </div>

              {/* 2. Featured Image Box (ফিচারড ইমেজ আপলোড করা) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#21759B]" /> ফিচারড ইমেজ আপলোড করুন (Featured Image)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ব্লগ পোস্টের মূল কভার ছবি যা আর্টিকেলের শীর্ষে এবং সোশ্যাল শেয়ারে দেখাবে
                    </p>
                  </div>
                  {currentMediaUrl && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Image Attached
                    </span>
                  )}
                </div>

                {!currentMediaUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-200 hover:border-[#21759B] bg-blue-50/30 hover:bg-blue-50/70 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="h-12 w-12 rounded-2xl bg-blue-100 text-[#21759B] group-hover:bg-[#21759B] group-hover:text-white flex items-center justify-center transition shadow-xs">
                      {uploadingMedia ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {uploadingMedia ? 'ছবি আপলোড হচ্ছে...' : 'ক্লিক করে ফিচারড ইমেজ আপলোড করুন'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        JPG, PNG, WEBP ফরম্যাট সাপোর্ট করে
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group max-h-72">
                    <img src={currentMediaUrl} alt="Featured" className="w-full h-64 object-cover" />
                    <button
                      type="button"
                      onClick={removeActiveMedia}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-white transition shadow-md cursor-pointer"
                      title="ছবি মুছে ফেলুন"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white uppercase tracking-wider">
                      Featured Image
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Categories Selection Box (ক্যাটাগরি সিলেক্ট করা) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-[#21759B]" /> ক্যাটাগরি সিলেক্ট করুন (WordPress Categories)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      সংযুক্ত ওয়ার্ডপ্রেস সাইট থেকে সরাসরি ক্যাটাগরি আনা হয়েছে
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                      {currentCategories.length} টি নির্বাচিত
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const wpAcc = accounts.find((a) => a.platform === 'WORDPRESS');
                        if (wpAcc) fetchWpCategories(wpAcc.id);
                      }}
                      disabled={loadingWpCategories}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-[#21759B] text-[11px] font-semibold transition cursor-pointer"
                      title="ক্যাটাগরি রিলোড করুন"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingWpCategories ? 'animate-spin' : ''}`} />
                      <span>রিফ্রেশ</span>
                    </button>
                  </div>
                </div>

                {/* Category Search if more than 4 */}
                {wpCategories.length > 4 && (
                  <div className="relative max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="ক্যাটাগরি সার্চ করুন..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#21759B] bg-slate-50/50"
                    />
                  </div>
                )}

                {loadingWpCategories ? (
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center gap-2 text-xs text-[#21759B] font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" /> ওয়ার্ডপ্রেস থেকে ক্যাটাগরি লোড হচ্ছে...
                  </div>
                ) : wpCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {wpCategories
                      .filter((c) => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map((cat) => {
                        const isSelected = (currentCategories || []).includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              const current = currentCategories || [];
                              if (isSelected) {
                                updateActiveCategories(current.filter((id) => id !== cat.id));
                              } else {
                                updateActiveCategories([...current, cat.id]);
                              }
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-[#21759B] text-white border-[#21759B] shadow-xs ring-2 ring-blue-300/60 scale-[1.02]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isSelected ? 'bg-white text-[#21759B]' : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : '+'}
                            </span>
                            <span>{cat.name}</span>
                            {cat.count !== undefined && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  isSelected ? 'bg-blue-700/60 text-white' : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {cat.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    ডিফল্ট ক্যাটাগরি (Uncategorized) ব্যবহার করা হবে।
                  </p>
                )}
              </div>

              {/* 4. Article Content with HTML Toolbar (H1, H2, H3, bold, inline image) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-[#21759B]" /> আর্টিকেল বডি ও ফরম্যাটিং (Article Body) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">{currentContent.length} characters</span>
                </div>

                {/* WordPress HTML Formatting Toolbar */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Quick Formatting Tags with H1, H2, H3 */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">HTML:</span>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h1>', '</h1>', 'Heading 1')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-900 font-black border border-slate-200 transition text-[11px] cursor-pointer shadow-2xs"
                        title="Heading 1 (<h1>)"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h2>', '</h2>', 'Section Heading')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 transition text-[11px] cursor-pointer shadow-2xs"
                        title="Heading 2 (<h2>)"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h3>', '</h3>', 'Sub-heading')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition text-[11px] cursor-pointer shadow-2xs"
                        title="Heading 3 (<h3>)"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<strong>', '</strong>', 'Bold text')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 transition text-[11px] cursor-pointer shadow-2xs"
                        title="Bold (<strong>)"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<em>', '</em>', 'Italic text')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-800 italic border border-slate-200 transition text-[11px] cursor-pointer shadow-2xs"
                        title="Italic (<em>)"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<blockquote class="border-l-4 border-blue-500 pl-4 italic my-2">', '</blockquote>', 'Quote')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition text-[11px] cursor-pointer shadow-2xs"
                        title="Blockquote"
                      >
                        Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<ul>\n  <li>', '</li>\n</ul>', 'List item')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition text-[11px] cursor-pointer shadow-2xs"
                        title="Bulleted List"
                      >
                        List
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<a href="https://example.com" target="_blank" rel="noopener noreferrer">', '</a>', 'Link')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-blue-600 underline border border-slate-200 transition text-[11px] cursor-pointer shadow-2xs"
                        title="Hyperlink (<a>)"
                      >
                        Link
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<pre><code>', '</code></pre>', 'Code')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 font-mono text-slate-700 border border-slate-200 transition text-[11px] cursor-pointer shadow-2xs"
                        title="Code snippet"
                      >
                        Code
                      </button>

                      <span className="text-slate-300 mx-0.5">|</span>

                      {/* Inline Image Upload Button */}
                      <button
                        type="button"
                        disabled={uploadingInline}
                        onClick={() => inlineImageInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#21759B] hover:bg-[#1a5f7e] text-white font-semibold transition text-[11px] cursor-pointer shadow-xs disabled:opacity-50"
                        title="কন্টেন্টের ভেতরে ছবি যুক্ত করুন"
                      >
                        {uploadingInline ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3 h-3" /> + Inline Image
                          </>
                        )}
                      </button>
                      <input
                        ref={inlineImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleInlineImageUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Mode Toggle: HTML Code vs Visual */}
                    <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setEditorMode('code')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                          editorMode === 'code' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileCode className="w-3 h-3" /> HTML Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode('visual')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                          editorMode === 'visual' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3 h-3" /> Visual View
                      </button>
                    </div>
                  </div>
                </div>

                {/* Editor: Code or Visual */}
                {editorMode === 'visual' ? (
                  <div className="w-full min-h-[200px] max-h-[450px] overflow-y-auto p-4 rounded-xl border border-slate-300 bg-slate-50/50 text-sm leading-relaxed text-slate-900">
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          currentContent ||
                          '<p class="text-slate-400 italic">এখানে আপনার আর্টিকেলের ভিজ্যুয়াল প্রিভিউ দেখাবে। কন্টেন্ট লিখতে উপরের "HTML Code" ট্যাবে যান।</p>',
                      }}
                    />
                  </div>
                ) : (
                  <textarea
                    ref={contentRef}
                    required
                    rows={10}
                    value={currentContent}
                    onChange={(e) => updateActiveContent(e.target.value)}
                    placeholder="এখানে আপনার ব্লগের আর্টিকেল লিখুন। উপরের টুলবার দিয়ে <h1>, <h2>, <h3>, <strong>, <a> ট্যাগ এবং ইনলাইন ছবি যুক্ত করতে পারবেন..."
                    className="w-full p-4 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#21759B] transition leading-relaxed text-slate-900"
                  />
                )}
              </div>

              {/* 5. WordPress Post Visibility & Status */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#21759B]" /> পোস্টের দৃশ্যমানতা ও স্ট্যাটাস (Status & Visibility)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Public */}
                  <div
                    onClick={() => updateActiveWpStatus('publish')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      currentWpStatus === 'publish'
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            currentWpStatus === 'publish' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Globe className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900">Public (পাবলিক)</p>
                          <span className="text-[10px] text-emerald-700 font-semibold">সবার জন্য লাইভ</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={currentWpStatus === 'publish'}
                        onChange={() => updateActiveWpStatus('publish')}
                        className="text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      {publishMode === 'schedule'
                        ? 'নির্ধারিত শিডিউল টাইমে সরাসরি সবার জন্য লাইভ হয়ে যাবে।'
                        : 'পোস্ট করার সাথে সাথে ওয়েবসাইটে সবার জন্য লাইভ দেখা যাবে।'}
                    </p>
                  </div>

                  {/* Private */}
                  <div
                    onClick={() => updateActiveWpStatus('private')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      currentWpStatus === 'private'
                        ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            currentWpStatus === 'private' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Lock className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900">Private (প্রাইভেট)</p>
                          <span className="text-[10px] text-amber-700 font-semibold">গোপন পোস্ট</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={currentWpStatus === 'private'}
                        onChange={() => updateActiveWpStatus('private')}
                        className="text-amber-600 focus:ring-amber-500 mt-1 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      শুধুমাত্র সাইটের অ্যাডমিন ও অথর দেখতে পারবেন। সাধারণ পাঠকরা দেখতে পাবে না।
                    </p>
                  </div>

                  {/* Draft */}
                  <div
                    onClick={() => updateActiveWpStatus('draft')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      currentWpStatus === 'draft'
                        ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            currentWpStatus === 'draft' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900">Draft (ড্রাফট)</p>
                          <span className="text-[10px] text-blue-700 font-semibold">খসড়া হিসেবে জমা</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={currentWpStatus === 'draft'}
                        onChange={() => updateActiveWpStatus('draft')}
                        className="text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      ওয়ার্ডপ্রেস ব্যাকএন্ডে ড্রাফট হিসেবে জমা থাকবে। পরে এডিট বা প্রকাশ করা যাবে।
                    </p>
                  </div>

                  {/* Pending Review */}
                  <div
                    onClick={() => updateActiveWpStatus('pending')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      currentWpStatus === 'pending'
                        ? 'border-purple-500 bg-purple-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            currentWpStatus === 'pending' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900">Pending Review</p>
                          <span className="text-[10px] text-purple-700 font-semibold">অনুমোদনের অপেক্ষায়</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={currentWpStatus === 'pending'}
                        onChange={() => updateActiveWpStatus('pending')}
                        className="text-purple-600 focus:ring-purple-500 mt-1 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      পর্যালোচনার জন্য জমা থাকবে। সিনিয়র এডিটর বা অ্যাডমিনের অনুমোদনের পর প্রকাশিত হবে।
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. Tags & Excerpt */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" /> Post Tags (ট্যাগ - কমা দিয়ে আলাদা করুন)
                    </label>
                    <input
                      type="text"
                      value={currentTags}
                      onChange={(e) => updateActiveTags(e.target.value)}
                      placeholder="যেমন: wordpress, technology, web dev"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#21759B] bg-white text-slate-900"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">ওয়ার্ডপ্রেসের ট্যাগে যুক্ত হবে</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Post Excerpt / সারসংক্ষেপ (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={currentExcerpt}
                      onChange={(e) => updateActiveExcerpt(e.target.value)}
                      placeholder="পোস্টের সংক্ষিপ্ত বিবরণ যা ব্লগ আর্কাইভে এবং গুগল সার্চে দেখাবে..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#21759B] bg-white text-slate-900"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">এসইও মেটা ডেসক্রিপশনে ব্যবহৃত হবে</p>
                  </div>
                </div>
              </div>

              {/* 7. WordPress Publishing Schedule & Submit */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPublishMode('now')}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      publishMode === 'now'
                        ? 'border-[#21759B] bg-blue-50 text-[#21759B] shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Send className="w-4 h-4" /> Publish Now
                  </button>

                  <button
                    type="button"
                    onClick={() => setPublishMode('schedule')}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      publishMode === 'schedule'
                        ? 'border-[#21759B] bg-blue-50 text-[#21759B] shadow-xs'
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#21759B] font-medium bg-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || uploadingMedia}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#21759B] hover:bg-[#1a5f7e] text-white font-semibold text-sm shadow-md shadow-blue-100 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Publishing to WordPress...
                    </>
                  ) : publishMode === 'now' ? (
                    <>
                      <Send className="w-4 h-4" /> Publish Article to WordPress Now
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" /> Schedule Article to Calendar
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ===================== SOCIAL MEDIA COMPOSER ===================== */
            <>
              {/* Active Channel Customization Notification Banner */}
              {!isMaster && activeAccount && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ChannelAvatar
                      avatar={activeAccount.avatar}
                      name={activeAccount.name}
                      platform={activeAccount.platform}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-bold truncate">
                        Customizing exclusively for {activeAccount.name} ({activeAccount.platform})
                      </p>
                      <p className="text-[11px] text-amber-700">
                        Changes made here override the master post content for this channel only.
                      </p>
                    </div>
                  </div>

                  {customizations[activeAccount.id]?.isCustomized && (
                    <button
                      type="button"
                      onClick={() => resetChannelToMaster(activeAccount.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 transition text-[11px] flex-shrink-0 cursor-pointer shadow-2xs"
                      title="Revert to master caption and media"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset to Master
                    </button>
                  )}
                </div>
              )}

              {/* Composer Main Box */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                {/* Post Caption */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      {isMaster ? 'Master Post Caption' : `${activeAccount?.name} Caption`}
                    </label>
                    <span className="text-xs text-slate-400">{currentContent.length} characters</span>
                  </div>

                  {/* Quick Mention Toolbar for Social Channels */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <AtSign className="w-3 h-3 text-indigo-500" /> Mention:
                    </span>
                    {AUDIENCE_TAGS.map((t) => (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => quickInsertMentionToField('content', t.tag)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 text-[11px] font-semibold transition border border-slate-200 cursor-pointer"
                      >
                        {t.tag}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={contentRef}
                    required
                    rows={4}
                    value={currentContent}
                    onChange={(e) =>
                      handleInputChangeWithMention('content', e.target.value, e.target.selectionStart)
                    }
                    onKeyUp={(e) =>
                      handleInputChangeWithMention('content', (e.target as any).value, (e.target as any).selectionStart)
                    }
                    onClick={(e) =>
                      handleInputChangeWithMention('content', (e.target as any).value, (e.target as any).selectionStart)
                    }
                    placeholder={
                      isMaster
                        ? 'What would you like to share across all channels? Type @ to mention a page, user or audience...'
                        : `Customize caption specifically for ${activeAccount?.name}... Type @ to mention...`
                    }
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition leading-relaxed text-slate-900"
                  />
                  {renderMentionDropdown('content')}
                </div>

                {/* Direct Media Upload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      {isMaster ? 'Master Media Attachment' : `${activeAccount?.name} Media Attachment`}
                    </label>
                    {activeAccount?.platform === 'INSTAGRAM' && (
                      <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                        Media Required for Instagram
                      </span>
                    )}
                  </div>

                  {!currentMediaUrl ? (
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
                      {currentMediaType === 'VIDEO' ? (
                        <video src={currentMediaUrl} controls className="w-full max-h-64 object-cover" />
                      ) : (
                        <img src={currentMediaUrl} alt="Uploaded" className="w-full max-h-64 object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={removeActiveMedia}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-white transition shadow-md cursor-pointer"
                        title="Remove media"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white uppercase tracking-wider">
                        {currentMediaType} Attached
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
                      <h3 className="font-bold text-sm text-slate-900">
                        {isMaster ? 'Automated First Comment' : `First Comment for ${activeAccount?.name}`}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Instantly drop your link or call-to-action in comment #1
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentEnableFirstComment}
                      onChange={(e) => updateActiveFirstCommentEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {currentEnableFirstComment && (
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
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 text-[10px] font-semibold transition border border-slate-200 cursor-pointer"
                        >
                          {t.tag}
                        </button>
                      ))}
                    </div>

                    <textarea
                      ref={firstCommentRef}
                      rows={2}
                      value={currentFirstCommentContent}
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
                        value={currentFirstCommentDelay}
                        onChange={(e) => updateActiveFirstCommentDelay(Number(e.target.value))}
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {enableMilestones && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addMilestone('LIKES', 10)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold border border-amber-200 transition cursor-pointer"
                      >
                        + 10 Likes Trigger
                      </button>
                      <button
                        type="button"
                        onClick={() => addMilestone('COMMENTS', 25)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold border border-amber-200 transition cursor-pointer"
                      >
                        + 25 Comments Trigger
                      </button>
                    </div>

                    <div className="space-y-2">
                      {milestones.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 font-bold text-slate-800">
                              <span>Target:</span>
                              <input
                                type="number"
                                min="1"
                                value={m.threshold}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setMilestones((prev) =>
                                    prev.map((item) => (item.id === m.id ? { ...item, threshold: val } : item))
                                  );
                                }}
                                className="w-16 px-1.5 py-0.5 border rounded bg-white"
                              />
                              <span>{m.type}</span>
                            </div>
                            <input
                              type="text"
                              value={m.commentText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMilestones((prev) =>
                                  prev.map((item) => (item.id === m.id ? { ...item, commentText: val } : item))
                                );
                              }}
                              className="w-full px-2 py-1 border rounded bg-white text-slate-800"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMilestone(m.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: Smart Comment Auto-Reply with Tagging */}
              <div className="bg-white p-6 rounded-2xl border border-violet-200 shadow-xs space-y-4">
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
                    <div className="p-3 rounded-xl bg-violet-50/80 border border-violet-200 flex items-start gap-2.5 text-xs text-violet-900">
                      <Bell className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-violet-950">
                          Smart Commenter Tagging & Instant Notification
                        </p>
                        <p className="text-[11px] text-violet-700 mt-0.5 leading-relaxed">
                          PostCraft will automatically tag the commenter in your reply so Facebook, Instagram & LinkedIn trigger an instant push notification on their phone!
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
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
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
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
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
                  disabled={
                    loading ||
                    selectedAccountIds.filter((id) => socialAccounts.some((a) => a.id === id)).length === 0 ||
                    uploadingMedia
                  }
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                    </>
                  ) : publishMode === 'now' ? (
                    <>
                      <Send className="w-4 h-4" /> Publish Live Post ({selectedAccountIds.filter((id) => socialAccounts.some((a) => a.id === id)).length} Channels)
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" /> Schedule ({selectedAccountIds.filter((id) => socialAccounts.some((a) => a.id === id)).length} Channels) to Calendar
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Right: Live Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Feed Preview
            </span>

            {/* Platform indicator badge */}
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                isPreviewWordPress
                  ? 'bg-[#21759B] text-white'
                  : isPreviewLinkedIn
                  ? 'bg-[#0A66C2] text-white'
                  : isPreviewInstagram
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {isPreviewWordPress
                ? 'WordPress Blog Article'
                : isPreviewLinkedIn
                ? 'LinkedIn Desktop Feed'
                : isPreviewInstagram
                ? 'Instagram Mobile Feed'
                : 'Facebook Desktop'}
            </span>
          </div>

          {/* If on Master tab: preview selector pills to quickly switch preview between selected channels */}
          {isMaster && selectedAccountIds.length > 1 && (
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl overflow-x-auto">
              <span className="text-[10px] font-bold text-slate-500 px-1">Preview:</span>
              {selectedAccountIds.map((accId) => {
                const acc = accounts.find((a) => a.id === accId);
                if (!acc) return null;
                const isCurrentPreview = previewAccount?.id === acc.id;

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setPreviewAccountId(acc.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isCurrentPreview
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ChannelAvatar
                      avatar={acc.avatar}
                      name={acc.name}
                      platform={acc.platform}
                      size="xs"
                    />
                    <span className="truncate max-w-[80px]">{acc.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* MOCKUP CONTAINER */}
          {previewAccount && previewData && (
            <>
              {isPreviewWordPress ? (
                /* WORDPRESS BLOG ARTICLE MOCKUP */
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-900 animate-in fade-in">
                  {/* Site Header Bar */}
                  <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#21759B] text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                        W
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate text-white">
                          {previewAccount.name || 'WordPress Site'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {previewAccount.pageId || previewAccount.accountId || 'https://yourwebsite.com'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {publishMode === 'schedule' ? (
                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500 text-white flex items-center gap-1 shadow-xs uppercase tracking-wider">
                          <Clock className="w-2.5 h-2.5" /> Scheduled: {previewData.wpStatus === 'private' ? 'Private' : previewData.wpStatus === 'draft' ? 'Draft' : previewData.wpStatus === 'pending' ? 'Pending' : 'Public'}
                        </span>
                      ) : previewData.wpStatus === 'private' ? (
                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-xs uppercase tracking-wider">
                          <Lock className="w-2.5 h-2.5" /> Private
                        </span>
                      ) : previewData.wpStatus === 'draft' ? (
                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-slate-600 text-white flex items-center gap-1 shadow-xs uppercase tracking-wider">
                          <FileText className="w-2.5 h-2.5" /> Draft
                        </span>
                      ) : previewData.wpStatus === 'pending' ? (
                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-purple-600 text-white flex items-center gap-1 shadow-xs uppercase tracking-wider">
                          <Clock className="w-2.5 h-2.5" /> Pending
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-xs uppercase tracking-wider">
                          <Globe className="w-2.5 h-2.5" /> Live Public
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Blog Header & Title */}
                  <div className="p-5 pb-3 border-b border-slate-100 space-y-2.5">
                    {/* Categories Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {previewData.categories && previewData.categories.length > 0 ? (
                        previewData.categories.map((catId) => {
                          const catObj = wpCategories.find((c) => c.id === catId);
                          return (
                            <span
                              key={catId}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#21759B] border border-blue-100"
                            >
                              {catObj?.name || `Category #${catId}`}
                            </span>
                          );
                        })
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                          Uncategorized
                        </span>
                      )}
                    </div>

                    {/* Article Heading (H1) */}
                    <h1 className="text-lg sm:text-xl font-bold text-slate-950 leading-tight">
                      {previewData.title || (
                        <span className="text-slate-400 italic">Untitled WordPress Article</span>
                      )}
                    </h1>

                    {/* Author & Meta */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ChannelAvatar
                        avatar={previewAccount.avatar}
                        name={previewAccount.name}
                        platform="WORDPRESS"
                        size="xs"
                        showBadge={false}
                      />
                      <span className="font-semibold text-slate-700">{previewAccount.name || 'Admin'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {publishMode === 'schedule' && scheduledAt
                          ? new Date(scheduledAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Today'}
                      </span>
                      <span>•</span>
                      <span>3 min read</span>
                    </div>
                  </div>

                  {/* Featured Image */}
                  {previewData.mediaUrl && (
                    <div className="relative w-full max-h-72 overflow-hidden bg-slate-900 border-b border-slate-100">
                      {previewData.mediaType === 'VIDEO' ? (
                        <video src={previewData.mediaUrl} controls className="w-full max-h-72 object-cover" />
                      ) : (
                        <img
                          src={previewData.mediaUrl}
                          alt="Featured Media"
                          className="w-full max-h-72 object-cover"
                        />
                      )}
                      <span className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded bg-slate-900/80 text-white">
                        Featured Media
                      </span>
                    </div>
                  )}

                  {/* Article Content with HTML rendering */}
                  <div className="p-5 space-y-3">
                    {previewData.excerpt && (
                      <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-[#21759B] text-xs italic text-slate-600">
                        {previewData.excerpt}
                      </div>
                    )}

                    <div
                      className="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2.5 font-normal"
                      dangerouslySetInnerHTML={{
                        __html:
                          previewData.content ||
                          '<p class="text-slate-400 italic">Article content with HTML tags and inline images will render here in real time...</p>',
                      }}
                    />

                    {/* Tags at bottom */}
                    {previewData.tags && (
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {previewData.tags.split(',').map((t, idx) => {
                          const tagClean = t.trim();
                          if (!tagClean) return null;
                          return (
                            <span
                              key={idx}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                              #{tagClean}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* WordPress Comment Preview if first comment enabled */}
                  {previewData.enableFirstComment && previewData.firstCommentContent.trim() && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#21759B] flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> 1 Comment on Article ({previewData.firstCommentDelay === 0 ? 'Instant' : `+${previewData.firstCommentDelay}m`})
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <ChannelAvatar
                          avatar={previewAccount.avatar}
                          name={previewAccount.name}
                          platform="WORDPRESS"
                          size="sm"
                          showBadge={false}
                        />
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">
                              {previewAccount.name || 'Author'}
                            </p>
                            <span className="text-[10px] text-slate-400">Post Author</span>
                          </div>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap mt-1 leading-relaxed">
                            {previewData.firstCommentContent}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : isPreviewLinkedIn ? (
                /* LINKEDIN DESKTOP FEED MOCKUP */
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-900">
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <ChannelAvatar
                        avatar={previewAccount.avatar}
                        name={previewAccount.name}
                        platform="LINKEDIN"
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {previewAccount.name || 'LinkedIn Member'}
                          </span>
                          <span className="text-slate-400 text-xs font-normal">• 1st</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate leading-tight">
                          Full Stack AI Engineer | PostCraft Architect · Creator
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          Just now • Edited • <Globe className="w-3 h-3 text-slate-400 inline" />
                        </p>
                      </div>
                    </div>

                    <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-4 pb-3">
                    <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {renderFormattedTextWithMentions(
                        previewData.content || 'Your LinkedIn post commentary will appear here in real time...',
                        'LINKEDIN'
                      )}
                    </div>
                  </div>

                  {previewData.mediaUrl && (
                    <div className="w-full bg-slate-950 max-h-84 overflow-hidden flex items-center justify-center border-t border-b border-slate-100">
                      {previewData.mediaType === 'VIDEO' ? (
                        <video src={previewData.mediaUrl} controls className="w-full max-h-84 object-cover" />
                      ) : (
                        <img src={previewData.mediaUrl} alt="LinkedIn Post Media" className="w-full object-cover max-h-84" />
                      )}
                    </div>
                  )}

                  <div className="px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100">
                    <div className="flex items-center gap-1">
                      <span className="flex items-center -space-x-1">
                        <span className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] shadow-2xs">👍</span>
                        <span className="h-4 w-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] shadow-2xs">💡</span>
                        <span className="h-4 w-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] shadow-2xs">❤️</span>
                      </span>
                      <span className="hover:text-[#0A66C2] hover:underline cursor-pointer ml-1">54</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hover:text-[#0A66C2] hover:underline cursor-pointer">18 comments</span>
                      <span>•</span>
                      <span className="hover:text-[#0A66C2] hover:underline cursor-pointer">5 reposts</span>
                    </div>
                  </div>

                  <div className="px-2 py-1 flex items-center justify-around text-slate-600 text-xs font-semibold">
                    <button type="button" className="flex-1 flex items-center justify-center gap-1.5 py-2 hover:bg-slate-100 rounded-lg transition">
                      <ThumbsUp className="w-4 h-4" /> Like
                    </button>
                    <button type="button" className="flex-1 flex items-center justify-center gap-1.5 py-2 hover:bg-slate-100 rounded-lg transition">
                      <MessageCircle className="w-4 h-4" /> Comment
                    </button>
                    <button type="button" className="flex-1 flex items-center justify-center gap-1.5 py-2 hover:bg-slate-100 rounded-lg transition">
                      <Share2 className="w-4 h-4" /> Repost
                    </button>
                    <button type="button" className="flex-1 flex items-center justify-center gap-1.5 py-2 hover:bg-slate-100 rounded-lg transition">
                      <Send className="w-4 h-4" /> Send
                    </button>
                  </div>

                  {previewData.enableFirstComment && previewData.firstCommentContent.trim() && (
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0A66C2] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Auto First Comment ({previewData.firstCommentDelay === 0 ? 'Instant' : `+${previewData.firstCommentDelay}m`})
                      </span>

                      <div className="flex items-start gap-2.5">
                        <ChannelAvatar
                          avatar={previewAccount.avatar}
                          name={previewAccount.name}
                          platform="LINKEDIN"
                          size="sm"
                          showBadge={false}
                        />
                        <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-xs border border-slate-200/80 flex-1 max-w-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">
                              {previewAccount.name || 'Member Name'}
                            </p>
                            <span className="text-[10px] text-slate-400">Author</span>
                          </div>
                          <p className="text-[10px] text-slate-500">Software Architect</p>
                          <div className="text-xs text-slate-800 whitespace-pre-wrap mt-1 leading-relaxed">
                            {renderFormattedTextWithMentions(previewData.firstCommentContent, 'LINKEDIN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : isPreviewInstagram ? (
                /* INSTAGRAM CARD MOCKUP */
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-900">
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ChannelAvatar
                        avatar={previewAccount.avatar}
                        name={previewAccount.name}
                        platform="INSTAGRAM"
                        size="sm"
                      />
                      <div>
                        <p className="font-bold text-xs text-slate-900 leading-tight">
                          {previewAccount.name ? previewAccount.name.replace(/^@/, '') : 'instagram_account'}
                        </p>
                        <p className="text-[10px] text-slate-400">Sponsored · Original audio</p>
                      </div>
                    </div>
                    <button type="button" className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-full bg-slate-950 aspect-square max-h-96 overflow-hidden flex items-center justify-center relative">
                    {previewData.mediaUrl ? (
                      previewData.mediaType === 'VIDEO' ? (
                        <video src={previewData.mediaUrl} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={previewData.mediaUrl} alt="Instagram Post" className="w-full h-full object-cover" />
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

                  <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-slate-800">
                    <div className="flex items-center gap-4">
                      <Heart className="w-5 h-5 hover:text-rose-500 cursor-pointer transition" />
                      <MessageCircle className="w-5 h-5 hover:text-indigo-600 cursor-pointer transition" />
                      <Send className="w-4 h-4 -rotate-45 hover:text-indigo-600 cursor-pointer transition" />
                    </div>
                    <Bookmark className="w-5 h-5 hover:text-slate-950 cursor-pointer transition" />
                  </div>

                  <div className="px-3.5 pt-1">
                    <p className="text-xs font-bold text-slate-900">1,428 likes</p>
                  </div>

                  <div className="px-3.5 pt-1.5 pb-2 text-xs text-slate-800 leading-relaxed">
                    <span className="font-bold mr-1.5 text-slate-900">
                      {previewAccount.name ? previewAccount.name.replace(/^@/, '') : 'instagram_account'}
                    </span>
                    <span className="whitespace-pre-wrap">
                      {renderFormattedTextWithMentions(
                        previewData.content || 'Your post caption will appear here in real time...',
                        'INSTAGRAM'
                      )}
                    </span>
                  </div>

                  {previewData.enableFirstComment && previewData.firstCommentContent.trim() && (
                    <div className="px-3.5 py-2.5 border-t border-slate-100 bg-pink-50/40 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3" /> Auto First Comment ({previewData.firstCommentDelay === 0 ? 'Instant' : `+${previewData.firstCommentDelay}m`})
                      </span>
                      <p className="text-slate-800 leading-snug">
                        <span className="font-bold mr-1.5 text-slate-900">
                          {previewAccount.name ? previewAccount.name.replace(/^@/, '') : 'instagram_account'}
                        </span>
                        {renderFormattedTextWithMentions(previewData.firstCommentContent, 'INSTAGRAM')}
                      </p>
                    </div>
                  )}

                  <div className="px-3.5 py-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>View all 24 comments</span>
                    <span>JUST NOW</span>
                  </div>
                </div>
              ) : (
                /* FACEBOOK DESKTOP CARD MOCKUP */
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <ChannelAvatar
                      avatar={previewAccount.avatar}
                      name={previewAccount.name}
                      platform="FACEBOOK"
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 leading-snug truncate">
                        {previewAccount.name || 'Your Facebook Page'}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        Just now · <Globe className="w-3 h-3 text-slate-400 inline" />
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-3">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {renderFormattedTextWithMentions(
                        previewData.content || 'Your post caption will appear here in real time...',
                        'FACEBOOK'
                      )}
                    </p>
                  </div>

                  {previewData.mediaUrl && (
                    <div className="w-full bg-slate-900 max-h-80 overflow-hidden flex items-center justify-center border-t border-b border-slate-100">
                      {previewData.mediaType === 'VIDEO' ? (
                        <video src={previewData.mediaUrl} controls className="w-full max-h-80 object-cover" />
                      ) : (
                        <img src={previewData.mediaUrl} alt="Attachment" className="w-full object-cover max-h-80" />
                      )}
                    </div>
                  )}

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

                  {previewData.enableFirstComment && previewData.firstCommentContent.trim() && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Auto First Comment ({previewData.firstCommentDelay === 0 ? 'Instant' : `+${previewData.firstCommentDelay}m`})
                      </span>

                      <div className="flex items-start gap-2.5">
                        <ChannelAvatar
                          avatar={previewAccount.avatar}
                          name={previewAccount.name}
                          platform="FACEBOOK"
                          size="sm"
                          showBadge={false}
                        />
                        <div className="bg-white p-3 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-2xs max-w-sm">
                          <p className="text-xs font-semibold text-slate-900">
                            {previewAccount.name || 'Page Name'}
                          </p>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap mt-0.5 leading-relaxed">
                            {renderFormattedTextWithMentions(previewData.firstCommentContent, 'FACEBOOK')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Interactive Profile Hover Card for Mentions */}
      {hoveredProfileData && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            top: Math.max(12, hoveredProfileData.rect.top - 210),
            left: Math.max(12, hoveredProfileData.rect.left - 60),
          }}
        >
          {hoveredProfileData.platform === 'LINKEDIN' ? (
            /* LinkedIn Profile Card */
            <div className="w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto">
              <div className="h-14 bg-gradient-to-r from-[#0A66C2] to-[#004182] relative"></div>
              <div className="px-4 pb-4 pt-0 space-y-2.5 relative">
                <div className="-mt-7 flex items-end justify-between">
                  <div className="relative">
                    <img
                      src={hoveredProfileData.profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt="Avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md bg-white"
                    />
                    {hoveredProfileData.profile.verified && (
                      <div className="absolute bottom-0 right-0 bg-[#0A66C2] text-white rounded-full p-0.5 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0A66C2] border border-blue-200">
                    {hoveredProfileData.profile.connections ? `${hoveredProfileData.profile.connections} Connection` : 'LinkedIn Network'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-sm text-slate-900 truncate">{hoveredProfileData.profile.name}</p>
                    {hoveredProfileData.profile.verified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-[#0A66C2] fill-[#0A66C2] text-white flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-tight mt-0.5">
                    {hoveredProfileData.profile.headline || hoveredProfileData.profile.subtitle}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {hoveredProfileData.profile.followers || '500+ connections'}
                  </p>
                </div>

                {hoveredProfileData.profile.bio && (
                  <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                    {hoveredProfileData.profile.bio}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    className="flex-1 py-1.5 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-xs flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Connect
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1.5 rounded-full border border-[#0A66C2] text-[#0A66C2] hover:bg-blue-50 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Message
                  </button>
                </div>
              </div>
            </div>
          ) : hoveredProfileData.platform === 'INSTAGRAM' ? (
            /* Instagram Profile Card */
            <div className="w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex-shrink-0">
                  <img
                    src={hoveredProfileData.profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover border border-white"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {hoveredProfileData.profile.tag.replace(/^@/, '')}
                    </p>
                    {hoveredProfileData.profile.verified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{hoveredProfileData.profile.name}</p>
                </div>
              </div>

              {hoveredProfileData.profile.bio && (
                <p className="text-xs text-slate-700 leading-snug">
                  {hoveredProfileData.profile.bio}
                </p>
              )}

              <div className="flex items-center justify-around pt-2 border-t border-slate-100 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">{hoveredProfileData.profile.postsCount || '142'}</p>
                  <p className="text-[10px] text-slate-400">posts</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{hoveredProfileData.profile.followers || '45K'}</p>
                  <p className="text-[10px] text-slate-400">followers</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{hoveredProfileData.profile.followingCount || '290'}</p>
                  <p className="text-[10px] text-slate-400">following</p>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Follow on Instagram
              </button>
            </div>
          ) : (
            /* Facebook Profile Card */
            <div className="w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto">
              <div className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 relative"></div>
              <div className="px-4 pb-4 pt-0 space-y-2.5 relative">
                <div className="-mt-7 flex items-end justify-between">
                  <div className="relative">
                    <img
                      src={hoveredProfileData.profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt="Avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    {hoveredProfileData.profile.verified && (
                      <div className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-0.5 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {hoveredProfileData.profile.type === 'page' ? 'Facebook Page' : 'Facebook Profile'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-sm text-slate-900 truncate">{hoveredProfileData.profile.name}</p>
                    {hoveredProfileData.profile.verified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-600 fill-blue-600 text-white flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{hoveredProfileData.profile.subtitle}</p>
                </div>

                {hoveredProfileData.profile.bio && (
                  <p className="text-xs text-slate-700 leading-snug">
                    {hoveredProfileData.profile.bio}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Follow
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}