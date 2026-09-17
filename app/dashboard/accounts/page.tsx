'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ChannelAvatar from '@/components/ChannelAvatar';
import {
  FacebookBrandIcon,
  InstagramBrandIcon,
  LinkedInBrandIcon,
  TikTokBrandIcon,
  WordPressBrandIcon,
  YouTubeBrandIcon,
  XTwitterBrandIcon,
  PinterestBrandIcon,
} from '@/components/icons/BrandIcons';
import {
  Share2,
  Instagram,
  Linkedin,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ExternalLink,
  Loader2,
  Sparkles,
  X,
  Key,
  Hash,
  HelpCircle,
  Globe,
  User,
  Zap,
  Check,
  Send,
  Layers,
  Info,
} from 'lucide-react';
import TikTokIcon from '@/components/icons/TikTokIcon';

interface Account {
  id: string;
  platform: string;
  accountId: string;
  name: string;
  avatar?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { posts: number };
}

type PlatformType = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'LINKEDIN' | 'WORDPRESS';

interface PlatformMeta {
  id: PlatformType;
  name: string;
  subtitle: string;
  badgeColor: string;
  activeBorder: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  description: string;
}

const SUPPORTED_PLATFORMS: PlatformMeta[] = [
  {
    id: 'FACEBOOK',
    name: 'Facebook',
    subtitle: 'Pages & Groups',
    badgeColor: 'bg-[#1877F2]',
    activeBorder: 'border-[#1877F2] ring-2 ring-[#1877F2]/20',
    icon: FacebookBrandIcon,
    description: 'Connect Facebook Pages or personal profiles to publish posts, photos, and automated first comments.',
  },
  {
    id: 'INSTAGRAM',
    name: 'Instagram',
    subtitle: 'Business & Creator',
    badgeColor: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600',
    activeBorder: 'border-pink-500 ring-2 ring-pink-500/20',
    icon: InstagramBrandIcon,
    description: 'Connect Instagram Business or Creator accounts to schedule Feed posts, Reels, and carousels.',
  },
  {
    id: 'TIKTOK',
    name: 'TikTok',
    subtitle: 'Videos & Music',
    badgeColor: 'bg-black',
    activeBorder: 'border-black ring-2 ring-slate-900/30',
    icon: TikTokBrandIcon,
    description: 'Connect TikTok Creator accounts to schedule 9:16 vertical videos, sound tracks, and milestone replies.',
  },
  {
    id: 'LINKEDIN',
    name: 'LinkedIn',
    subtitle: 'Company & Profile',
    badgeColor: 'bg-[#0A66C2]',
    activeBorder: 'border-[#0A66C2] ring-2 ring-[#0A66C2]/20',
    icon: LinkedInBrandIcon,
    description: 'Connect LinkedIn personal profiles or company organizations to share articles and professional updates.',
  },
  {
    id: 'WORDPRESS',
    name: 'WordPress',
    subtitle: 'Blogs & CMS',
    badgeColor: 'bg-[#21759B]',
    activeBorder: 'border-[#21759B] ring-2 ring-[#21759B]/20',
    icon: WordPressBrandIcon,
    description: 'Connect self-hosted WordPress sites or WordPress.com via Application Passwords to publish full blog posts.',
  },
];

const UPCOMING_PLATFORMS = [
  {
    id: 'YOUTUBE',
    name: 'YouTube',
    subtitle: 'Shorts & Videos',
    icon: YouTubeBrandIcon,
  },
  {
    id: 'X_TWITTER',
    name: 'X (Twitter)',
    subtitle: 'Tweets & Threads',
    icon: XTwitterBrandIcon,
  },
  {
    id: 'PINTEREST',
    name: 'Pinterest',
    subtitle: 'Pins & Boards',
    icon: PinterestBrandIcon,
  },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fastConnecting, setFastConnecting] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>('FACEBOOK');
  const [pageId, setPageId] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active channel filter in the right column
  const [activeFilter, setActiveFilter] = useState<'ALL' | PlatformType>('ALL');

  // Guide Popup Modal state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<PlatformType>('FACEBOOK');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openGuide = (selectedPlatform?: PlatformType) => {
    setGuidePlatform(selectedPlatform || platform);
    setIsGuideOpen(true);
  };

  // 1-Click Fast Connect Handler
  const handleFastConnect = async (targetPlatform: PlatformType) => {
    setMessage(null);
    setFastConnecting(true);

    const defaultNames: Record<PlatformType, string> = {
      FACEBOOK: 'TechCraft Facebook Page',
      INSTAGRAM: 'TechCraft Instagram Business',
      TIKTOK: 'TechCraft TikTok Creator',
      LINKEDIN: 'Alamin LinkedIn Profile',
      WORDPRESS: 'TechCraft WordPress Site',
    };

    try {
      const res = await fetch('/api/oauth/fast-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: targetPlatform,
          name: defaultNames[targetPlatform] || 'My Social Channel',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed to fast-connect ${targetPlatform}` });
        return;
      }

      setMessage({
        type: 'success',
        text: `⚡ ${targetPlatform} connected successfully via 1-Click Fast Connect!`,
      });
      fetchAccounts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Network error during Fast Connect' });
    } finally {
      setFastConnecting(false);
    }
  };

  // Manual API Connection Form Submit
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          pageId: pageId.trim(),
          accessToken: accessToken.trim(),
          username: wpUsername.trim(),
          appPassword: accessToken.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed to connect ${platform}` });
        return;
      }

      setMessage({ type: 'success', text: data.message });
      setPageId('');
      setWpUsername('');
      setAccessToken('');
      fetchAccounts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this channel?')) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts(accounts.filter((a) => a.id !== id));
        setMessage({ type: 'success', text: 'Channel disconnected successfully.' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fillSimulatedDemo = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    if (platform === 'TIKTOK') {
      setPageId(`open_creator_${randomId}`);
      setAccessToken('AUTOCONNECT_TIKTOK_TOKEN_SIMULATED');
    } else if (platform === 'WORDPRESS') {
      setPageId('https://techcraft.example.com');
      setWpUsername('demouser');
      setAccessToken('TEST_WP_APP_PASSWORD_12345');
    } else if (platform === 'LINKEDIN') {
      setPageId(`urn:li:person:TEST_LI_${randomId}`);
      setAccessToken('TEST_LINKEDIN_TOKEN_SIMULATED');
    } else if (platform === 'INSTAGRAM') {
      setPageId(`TEST_IG_${randomId}`);
      setAccessToken('TEST_INSTAGRAM_TOKEN_SIMULATED');
    } else {
      // Facebook
      setPageId(`TEST_FB_${randomId}`);
      setAccessToken('TEST_FACEBOOK_TOKEN_SIMULATED');
    }
  };

  // Filtered accounts for display
  const filteredAccounts =
    activeFilter === 'ALL'
      ? accounts
      : accounts.filter((a) => a.platform.toUpperCase() === activeFilter);

  // Current active platform metadata
  const currentMeta = SUPPORTED_PLATFORMS.find((p) => p.id === platform) || SUPPORTED_PLATFORMS[0];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" /> Connected Accounts & Channels
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Easily connect Facebook, Instagram, TikTok, LinkedIn, and WordPress sites to automate posting and scheduling.
          </p>
        </div>

        {/* Prominent Guide Button */}
        <button
          type="button"
          onClick={() => openGuide(platform)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition shadow-2xs cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Connection Guide (How to Connect)</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VISUAL PLATFORM HUB (AUTHENTIC BRAND IMAGE ICONS IN INTERACTIVE GRID) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Platform Hub
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Select Platform to Connect & Configure
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Total Connected:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
              {accounts.length} Channels Active
            </span>
          </div>
        </div>

        {/* Supported Platforms Grid with Real Brand Logos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {SUPPORTED_PLATFORMS.map((p) => {
            const isSelected = platform === p.id;
            const connectedCount = accounts.filter((a) => a.platform.toUpperCase() === p.id).length;
            const IconComponent = p.icon;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPlatform(p.id);
                  setActiveFilter(p.id);
                }}
                className={`relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:shadow-md ${
                  isSelected
                    ? `${p.activeBorder} bg-slate-50/70 shadow-sm translate-y-[-2px]`
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                {/* Active Checkmark Pill */}
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                <div>
                  {/* Authentic SVG Brand Logo */}
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition">
                    <IconComponent className="w-11 h-11" />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {p.subtitle}
                  </p>
                </div>

                {/* Connection Status Pill */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  {connectedCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {connectedCount} Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 group-hover:text-indigo-600 transition">
                      <Plus className="w-3 h-3" /> Connect
                    </span>
                  )}

                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600">
                    {isSelected ? 'Active' : 'Configure'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Future / Upcoming Platforms Row (Directly fulfilling user request for future roadmap) */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Upcoming Channels (In Roadmap):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {UPCOMING_PLATFORMS.map((up) => {
              const UpIcon = up.icon;
              return (
                <div
                  key={up.id}
                  className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between opacity-80 hover:opacity-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
                      <UpIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{up.name}</p>
                      <p className="text-[10px] text-slate-400">{up.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-600">
                    Coming Soon
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONNECTION STUDIO & ACTIVE CHANNELS (2 COLUMNS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Connect Studio for Selected Platform (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          {/* Header of Active Platform */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-2xs">
                <CurrentIcon className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">
                  Connect {currentMeta.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentMeta.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openGuide(platform)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Guide
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {currentMeta.description}
          </p>

          {/* ⚡ 1-Click Fast Connect Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-slate-50 to-purple-50/70 border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400" /> 1-Click Fast Connect
              </span>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                Instant Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Connect a verified {currentMeta.name} channel with 1 click to start scheduling and posting right away without API setup.
            </p>
            <button
              type="button"
              disabled={fastConnecting}
              onClick={() => handleFastConnect(platform)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {fastConnecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fast Connecting {currentMeta.name}...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" /> Fast Connect {currentMeta.name} Now
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute">
              Or Use Official API Credentials
            </span>
          </div>

          {/* Manual API Connect Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            {/* Account / Page ID / Site URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" />
                {platform === 'WORDPRESS'
                  ? 'WordPress Site URL'
                  : platform === 'TIKTOK'
                  ? 'TikTok OpenID or Handle'
                  : platform === 'LINKEDIN'
                  ? 'LinkedIn Member URN or Org ID'
                  : platform === 'INSTAGRAM'
                  ? 'Instagram Business or Creator ID'
                  : 'Facebook Page ID or User ID'}
              </label>
              <input
                type="text"
                required
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder={
                  platform === 'WORDPRESS'
                    ? 'https://yourwebsite.com'
                    : platform === 'TIKTOK'
                    ? 'e.g. open_12345678 or @alamin_tech'
                    : platform === 'LINKEDIN'
                    ? 'urn:li:person:... or urn:li:organization:... (or "me")'
                    : platform === 'INSTAGRAM'
                    ? 'e.g. 17841405309214589'
                    : 'e.g. 102938475610293 or "me"'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-xs text-slate-900 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {platform === 'WORDPRESS'
                  ? 'Enter full URL of your WordPress website (e.g. https://yourwebsite.com)'
                  : platform === 'TIKTOK'
                  ? 'Enter your TikTok Creator OpenID or username handle (e.g. @your_creator_name)'
                  : platform === 'LINKEDIN'
                  ? 'For company pages, enter company page numerical ID or URL. For personal profile, write "me".'
                  : platform === 'INSTAGRAM'
                  ? 'Your Instagram Business or Creator account ID'
                  : 'Facebook Page ID, or enter "me" for personal user account'}
              </p>
            </div>

            {/* WordPress Username Field */}
            {platform === 'WORDPRESS' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  WordPress Username
                </label>
                <input
                  type="text"
                  required
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  placeholder="admin or your WordPress username"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#21759B] focus:border-[#21759B] transition font-mono text-xs text-slate-900 bg-white"
                />
              </div>
            )}

            {/* Access Token / Application Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Key className="w-3 h-3 text-slate-400" />
                {platform === 'WORDPRESS'
                  ? 'Application Password'
                  : platform === 'TIKTOK'
                  ? 'TikTok Creator Access Token'
                  : 'Access Token'}
              </label>
              <textarea
                required
                rows={platform === 'WORDPRESS' ? 2 : 3}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={
                  platform === 'WORDPRESS'
                    ? 'xxxx xxxx xxxx xxxx (Application Password)'
                    : platform === 'TIKTOK'
                    ? 'act.example.tiktok.oauth.token...'
                    : platform === 'LINKEDIN'
                    ? 'AQ... (LinkedIn OAuth 2.0 Access Token)'
                    : platform === 'INSTAGRAM'
                    ? 'EAAG... (Meta Graph API Access Token)'
                    : 'EAAG... (Facebook Page or User Access Token)'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-xs text-slate-900 bg-white leading-relaxed"
              />
              {platform === 'WORDPRESS' && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Paste the password generated from WordPress: Users &gt; Profile &gt; Application Passwords.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer ${
                platform === 'TIKTOK'
                  ? 'bg-black hover:bg-slate-900 ring-1 ring-slate-800'
                  : platform === 'WORDPRESS'
                  ? 'bg-[#21759B] hover:bg-[#1a5d7c]'
                  : platform === 'LINKEDIN'
                  ? 'bg-[#0A66C2] hover:bg-[#004182]'
                  : platform === 'INSTAGRAM'
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95'
                  : 'bg-[#1877F2] hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying with {currentMeta.name}...
                </>
              ) : (
                <>
                  Connect {currentMeta.name} via API
                </>
              )}
            </button>

            {/* Instant Demo Test Button */}
            <button
              type="button"
              onClick={fillSimulatedDemo}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-200 text-xs text-indigo-700 font-semibold hover:bg-indigo-50/60 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Fill Demo Test Credentials (Instant Test)
            </button>
          </form>
        </div>

        {/* Right: Connected Channels List (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Active Connected Channels ({accounts.length})
              </h2>
              <p className="text-xs text-slate-400">All channels active and ready for posting</p>
            </div>

            {/* Quick action button to create post */}
            {accounts.length > 0 && (
              <Link
                href="/dashboard/create-post"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition"
              >
                <Send className="w-3.5 h-3.5" /> Compose Post
              </Link>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({accounts.length})
            </button>

            {SUPPORTED_PLATFORMS.map((p) => {
              const count = accounts.filter((a) => a.platform.toUpperCase() === p.id).length;
              const isPActive = activeFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveFilter(p.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                    isPActive
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{p.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isPActive ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Channels List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <CurrentIcon className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {activeFilter === 'ALL'
                  ? 'No social channels connected yet'
                  : `No ${activeFilter} accounts connected`}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Select a platform on the left to connect via 1-Click Fast Connect or API credentials.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAccounts.map((acc) => {
                const isPersonal = acc.category?.toLowerCase().includes('profile');

                return (
                  <div
                    key={acc.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition flex items-center justify-between gap-4 bg-white"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <ChannelAvatar
                        avatar={acc.avatar}
                        name={acc.name}
                        platform={acc.platform}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 truncate">
                            {acc.name}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              acc.platform === 'TIKTOK'
                                ? 'bg-black text-white border-slate-800'
                                : acc.platform === 'WORDPRESS'
                                ? 'bg-blue-50 text-[#21759B] border-blue-200'
                                : acc.platform === 'LINKEDIN'
                                ? 'bg-blue-50 text-[#0A66C2] border-blue-200'
                                : acc.platform === 'INSTAGRAM'
                                ? 'bg-pink-50 text-pink-700 border-pink-200'
                                : isPersonal
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {acc.platform === 'TIKTOK'
                              ? '🎵 TikTok Creator'
                              : acc.platform === 'WORDPRESS'
                              ? '🌐 WordPress Site'
                              : acc.platform === 'LINKEDIN'
                              ? '💼 LinkedIn'
                              : acc.platform === 'INSTAGRAM'
                              ? '📸 Instagram'
                              : isPersonal
                              ? '👤 Facebook Profile'
                              : '🏢 Facebook Page'}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          ID / URL: <span className="font-mono text-[11px] text-slate-600 font-medium">{acc.accountId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href="/dashboard/create-post"
                        title="Create Post with this account"
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition cursor-pointer border border-indigo-100 flex items-center gap-1 text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Post
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDisconnect(acc.id)}
                        title="Disconnect Channel"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-slate-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. POPUP MODAL: API CONNECT SETUP GUIDE */}
      {/* ========================================================================= */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Step-by-Step API Connection Guide
                  </h3>
                  <p className="text-xs text-slate-500">
                    Follow the instructions below to obtain your ID and Access Token for each platform.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Platform Navigation with Brand Logos */}
            <div className="flex border-b border-slate-100 bg-white px-5 pt-3 gap-2 overflow-x-auto">
              {SUPPORTED_PLATFORMS.map((p) => {
                const IconC = p.icon;
                const isGSelected = guidePlatform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setGuidePlatform(p.id)}
                    className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer flex-shrink-0 ${
                      isGSelected
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <IconC className="w-4 h-4" />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
              {guidePlatform === 'FACEBOOK' && (
                <div className="space-y-4">
                  {/* Step 1: Tool link */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-blue-950 text-sm">1. Open Meta Graph API Explorer</p>
                      <p className="text-blue-800 text-xs mt-0.5">
                        Get your tokens and IDs directly from Meta official developer tool in a few clicks.
                      </p>
                    </div>
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 text-xs flex-shrink-0 shadow-2xs"
                    >
                      Explorer Tool <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Option A: Page */}
                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      How to connect a Facebook Page:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>Visit the Graph API Explorer and select your <strong>Facebook Page</strong> from the <strong>User or Page</strong> dropdown.</li>
                      <li>In <strong>Add Permission</strong>, add <code className="px-1.5 py-0.5 bg-slate-100 text-indigo-600 rounded font-mono">pages_manage_posts</code> and <code className="px-1.5 py-0.5 bg-slate-100 text-indigo-600 rounded font-mono">pages_read_engagement</code> permissions.</li>
                      <li>Click <strong>Generate Access Token</strong> and approve the Facebook login prompt.</li>
                      <li>Copy the generated <strong>Access Token</strong> into the token box, put your Page ID in the ID box, and click Connect.</li>
                    </ol>
                  </div>

                  {/* Option B: Profile */}
                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      How to connect a personal Facebook profile:
                    </p>
                    <p className="text-slate-600">
                      In the Explorer, select User Token. In the ID box, simply enter <code className="px-1.5 py-0.5 bg-purple-50 text-purple-700 font-bold rounded">me</code> or your user ID, and paste the generated User Access Token.
                    </p>
                  </div>
                </div>
              )}

              {guidePlatform === 'INSTAGRAM' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-pink-950 text-sm">Instagram Prerequisite Requirements</p>
                      <p className="text-pink-800 text-xs mt-0.5">
                        Your account must be a <strong>Professional (Business or Creator)</strong> account and linked to a Facebook Page.
                      </p>
                    </div>
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-bold flex items-center gap-1 text-xs flex-shrink-0 shadow-2xs"
                    >
                      Meta Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-600"></span>
                      How to get Instagram Business Account ID & Token:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>In the Graph API Explorer, select your connected Facebook Page.</li>
                      <li>In permissions, ensure <code className="px-1.5 py-0.5 bg-slate-100 text-pink-600 rounded font-mono">instagram_basic</code> and <code className="px-1.5 py-0.5 bg-slate-100 text-pink-600 rounded font-mono">instagram_content_publish</code> are selected.</li>
                      <li>In the Explorer query field, run: <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-bold">GET me?fields=instagram_business_account</code>.</li>
                      <li>Copy the numeric ID found in <code className="font-mono text-pink-600">instagram_business_account.id</code>.</li>
                      <li>Paste the ID and the Page Access Token into PostCraft and click Connect.</li>
                    </ol>
                  </div>
                </div>
              )}

              {guidePlatform === 'TIKTOK' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white text-sm flex items-center gap-1.5">
                        <TikTokIcon className="w-4 h-4 text-[#25F4EE]" /> TikTok for Developers Setup
                      </p>
                      <p className="text-slate-300 text-xs mt-0.5">
                        Register your app on TikTok Developer Portal to obtain Creator OpenID & User Access Tokens.
                      </p>
                    </div>
                    <a
                      href="https://developers.tiktok.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white text-black hover:bg-slate-100 font-bold flex items-center gap-1 text-xs flex-shrink-0 shadow-2xs"
                    >
                      TikTok Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-black"></span>
                      How to get TikTok Credentials:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>Go to <strong>developers.tiktok.com</strong> and create an application.</li>
                      <li>Add the <strong>Content Posting API</strong> service under your app configuration.</li>
                      <li>Request scopes: <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono">user.info.basic</code>, <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono">video.publish</code>, and <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono">video.upload</code>.</li>
                      <li>Complete TikTok Creator OAuth authorization to receive your <code className="font-mono text-black font-bold">open_id</code> and <code className="font-mono text-black font-bold">access_token</code>.</li>
                      <li>Paste them into PostCraft to activate instant vertical video publishing!</li>
                    </ol>
                  </div>
                </div>
              )}

              {guidePlatform === 'LINKEDIN' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#0A66C2] text-sm">LinkedIn Developer Portal</p>
                      <p className="text-blue-800 text-xs mt-0.5">
                        Create an app at LinkedIn Developer Portal to access the Community Management API.
                      </p>
                    </div>
                    <a
                      href="https://www.linkedin.com/developers/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold flex items-center gap-1 text-xs flex-shrink-0 shadow-2xs"
                    >
                      LinkedIn Apps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0A66C2]"></span>
                      How to get LinkedIn Token:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>Under your app products, request <strong>Share on LinkedIn</strong> and <strong>Sign In with LinkedIn using OpenID Connect</strong>.</li>
                      <li>Generate an OAuth 2.0 Access Token with <code className="px-1.5 py-0.5 bg-slate-100 text-[#0A66C2] rounded font-mono">w_member_social</code> scope.</li>
                      <li>For personal profiles, in the ID box enter <code className="px-1.5 py-0.5 bg-blue-50 text-[#0A66C2] font-bold rounded">me</code>.</li>
                      <li>For company pages, enter <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono">urn:li:organization:YOUR_PAGE_ID</code>.</li>
                    </ol>
                  </div>
                </div>
              )}

              {guidePlatform === 'WORDPRESS' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#21759B]/10 border border-[#21759B]/20 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#21759B] text-sm">No Plugins Required for WordPress</p>
                      <p className="text-slate-600 text-xs mt-0.5">
                        Modern WordPress (5.6+) has native Application Passwords built right into the core!
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#21759B] text-white text-[10px] font-bold">
                      Native Feature
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#21759B]"></span>
                      3-Step Setup on your WordPress site:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>Log in to your WordPress Admin dashboard (<code className="font-mono text-slate-800">/wp-admin</code>).</li>
                      <li>Go to <strong>Users &gt; Profile</strong> (or Edit User for an administrator/editor).</li>
                      <li>Scroll down to the <strong>Application Passwords</strong> section.</li>
                      <li>Type an Application name (e.g. <code className="px-1.5 py-0.5 bg-slate-100 text-[#21759B] rounded font-mono">PostCraft</code>) and click <strong>Add New Application Password</strong>.</li>
                      <li>Copy the generated 16-character password (e.g. <code className="font-mono bg-slate-100 px-1 rounded">abcd efgh ijkl mnop</code>).</li>
                      <li>Paste your site URL, your username, and this Application Password into PostCraft!</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500" /> Need instant testing? Use <strong>1-Click Fast Connect</strong> on the main screen.
              </span>
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
