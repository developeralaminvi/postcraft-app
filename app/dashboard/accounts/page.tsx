'use client';

import React, { useState, useEffect } from 'react';
import ChannelAvatar from '@/components/ChannelAvatar';
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
  Shield,
  Globe,
  User,
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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [platform, setPlatform] = useState<'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'WORDPRESS' | 'TIKTOK'>('FACEBOOK');
  const [pageId, setPageId] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Guide Popup Modal state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'WORDPRESS' | 'TIKTOK'>('FACEBOOK');

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

  const openGuide = (selectedPlatform?: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'WORDPRESS' | 'TIKTOK') => {
    setGuidePlatform(selectedPlatform || platform);
    setIsGuideOpen(true);
  };

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
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts(accounts.filter((a) => a.id !== id));
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

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Connected Accounts & Channels</h1>
          <p className="text-sm text-slate-500 mt-1">
            Easily connect Facebook, Instagram, LinkedIn pages, personal profiles, and WordPress sites.
          </p>
        </div>

        {/* Prominent Guide Button */}
        <button
          type="button"
          onClick={() => openGuide(platform)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition shadow-2xs cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Connection Guide (How to Connect)</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid: Connect Form & Connected List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Connect Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          {/* Simple Platform Switcher (No messy sub-tabs) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Platform
            </label>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPlatform('FACEBOOK')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  platform === 'FACEBOOK'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" /> Facebook
              </button>
              <button
                type="button"
                onClick={() => setPlatform('INSTAGRAM')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  platform === 'INSTAGRAM'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </button>
              <button
                type="button"
                onClick={() => setPlatform('LINKEDIN')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  platform === 'LINKEDIN'
                    ? 'bg-[#0A66C2] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </button>
              <button
                type="button"
                onClick={() => setPlatform('WORDPRESS')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  platform === 'WORDPRESS'
                    ? 'bg-[#21759B] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> WordPress
              </button>
              <button
                type="button"
                onClick={() => setPlatform('TIKTOK')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  platform === 'TIKTOK'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TikTokIcon className="w-3.5 h-3.5" /> TikTok
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Connect {platform === 'WORDPRESS' ? 'WordPress Site' : platform === 'TIKTOK' ? 'TikTok Creator' : platform === 'LINKEDIN' ? 'LinkedIn' : platform === 'INSTAGRAM' ? 'Instagram' : 'Facebook'}
            </h2>
            <button
              type="button"
              onClick={() => openGuide(platform)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Need help?
            </button>
          </div>

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
                {platform === 'WORDPRESS' ? 'Application Password' : platform === 'TIKTOK' ? 'TikTok Creator Access Token' : 'Access Token'}
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
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying with {platform}...
                </>
              ) : (
                <>
                  Connect {platform === 'WORDPRESS' ? 'WordPress Site' : platform === 'TIKTOK' ? 'TikTok Creator' : platform}
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
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-slate-900">
              Active Connected Channels ({accounts.length})
            </h2>
            <span className="text-xs text-slate-400">Channels active for posting</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Share2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No social channels connected yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Use the form on the left to connect Facebook, Instagram, LinkedIn, or WordPress.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => {
                const isPersonal = acc.category?.toLowerCase().includes('profile');

                return (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between gap-4 bg-white"
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
                          <h3 className="font-semibold text-sm text-slate-900 truncate">
                            {acc.name}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              acc.platform === 'TIKTOK'
                                ? 'bg-black text-white border-slate-800'
                                : acc.platform === 'WORDPRESS'
                                ? 'bg-blue-50 text-[#21759B] border-blue-200'
                                : isPersonal
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {acc.platform === 'TIKTOK'
                              ? '🎵 TikTok Creator'
                              : acc.platform === 'WORDPRESS'
                              ? '🌐 WordPress Site'
                              : isPersonal
                              ? '👤 Personal Profile'
                              : '🏢 Page'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          ID: <span className="font-mono text-[11px] text-slate-500">{acc.accountId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDisconnect(acc.id)}
                        title="Disconnect Channel"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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

      {/* POPUP MODAL: API Connect Setup Guide */}
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

            {/* Modal Platform Navigation */}
            <div className="flex border-b border-slate-100 bg-white px-5 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setGuidePlatform('FACEBOOK')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  guidePlatform === 'FACEBOOK'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" /> Facebook Guide
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform('INSTAGRAM')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  guidePlatform === 'INSTAGRAM'
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" /> Instagram Guide
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform('LINKEDIN')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  guidePlatform === 'LINKEDIN'
                    ? 'border-[#0A66C2] text-[#0A66C2]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn Guide
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform('WORDPRESS')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  guidePlatform === 'WORDPRESS'
                    ? 'border-[#21759B] text-[#21759B]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> WordPress Guide
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform('TIKTOK')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  guidePlatform === 'TIKTOK'
                    ? 'border-black text-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <TikTokIcon className="w-3.5 h-3.5" /> TikTok Guide
              </button>
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
                    <p className="font-bold text-slate-900 text-xs">Step-by-step Instagram connection procedure:</p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>Convert your Instagram account to a Professional Account using the mobile app (Settings &gt; Account &gt; Switch to Professional).</li>
                      <li>In your Facebook Page settings, link your Instagram account to the Facebook Page.</li>
                      <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-pink-600 font-semibold underline">Meta Graph API Explorer</a>.</li>
                      <li>Add permissions <code className="px-1.5 py-0.5 bg-slate-100 text-pink-600 rounded font-mono">instagram_basic</code> and <code className="px-1.5 py-0.5 bg-slate-100 text-pink-600 rounded font-mono">instagram_content_publish</code>.</li>
                      <li>Generate the access token, paste your Instagram Account ID and Access Token in the form, and click Connect.</li>
                    </ol>
                  </div>
                </div>
              )}

              {guidePlatform === 'LINKEDIN' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-blue-950 text-sm">LinkedIn Developer Portal</p>
                      <p className="text-blue-800 text-xs mt-0.5">
                        Direct link to generate access tokens for personal profiles or company pages.
                      </p>
                    </div>
                    <a
                      href="https://www.linkedin.com/developers/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold flex items-center gap-1 text-xs flex-shrink-0 shadow-2xs"
                    >
                      Developer Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0A66C2]"></span>
                      1. Personal Profile:
                    </p>
                    <p className="text-slate-600 pl-3.5">
                      No numeric ID needed for personal profiles—simply type <code className="px-1.5 py-0.5 bg-blue-50 text-[#0A66C2] font-bold rounded">me</code> into the ID box and connect with your generated Access Token.
                    </p>

                    <div className="pt-2 border-t border-slate-100"></div>

                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0A66C2]"></span>
                      2. How to find your Company Page ID:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>Log in to LinkedIn and navigate to your company page <strong>Admin View</strong>.</li>
                      <li>Check the browser address bar: <code className="px-1 py-0.5 bg-slate-100 text-slate-800 rounded font-mono">linkedin.com/company/<strong>12345678</strong>/admin/...</code></li>
                      <li>The number right after <code className="px-1 py-0.5 bg-blue-50 text-[#0A66C2] font-bold rounded">/company/</code> (e.g. <strong>12345678</strong>) is your Page ID!</li>
                      <li>You can enter this number directly or paste the whole URL in the ID box (the system automatically extracts the ID).</li>
                      <li>When generating the token, ensure you include the <code className="px-1.5 py-0.5 bg-slate-100 text-[#0A66C2] rounded font-mono">w_organization_social</code> permission.</li>
                    </ol>
                  </div>
                </div>
              )}

              {guidePlatform === 'WORDPRESS' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#21759B]/10 border border-[#21759B]/20 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#1a5d7c] text-sm">WordPress Application Passwords</p>
                      <p className="text-[#21759B] text-xs mt-0.5">
                        Built natively into WordPress 5.6+. No extra plugins required for secure publishing.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#21759B]"></span>
                      Step-by-step WordPress connection:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-slate-600 text-xs">
                      <li>Log in to your WordPress admin dashboard (e.g. <code className="px-1 py-0.5 bg-slate-100 rounded">https://yourwebsite.com/wp-admin</code>).</li>
                      <li>From the left sidebar, navigate to <strong>Users &gt; Profile</strong>.</li>
                      <li>Scroll down to the <strong>Application Passwords</strong> section.</li>
                      <li>In <strong>New Application Password Name</strong>, type: <code className="px-1.5 py-0.5 bg-cyan-50 text-[#21759B] font-bold rounded">PostCraft</code>.</li>
                      <li>Click <strong>Add New Application Password</strong>.</li>
                      <li>Copy the 24-character generated password (e.g. <code className="px-1 py-0.5 bg-slate-100 font-mono">abcd efgh ijkl mnop</code>).</li>
                      <li>Return to PostCraft, enter your <strong>Site URL</strong>, <strong>Username</strong>, and paste the <strong>Application Password</strong>, then click Connect!</li>
                    </ol>
                  </div>
                </div>
              )}

              {guidePlatform === 'TIKTOK' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-black text-white flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white text-sm">TikTok for Developers Portal</p>
                      <p className="text-slate-300 text-xs mt-0.5">
                        Connect using TikTok Content Posting API or use instant 1-Click Demo testing.
                      </p>
                    </div>
                    <a
                      href="https://developers.tiktok.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-1 text-xs flex-shrink-0 shadow-2xs"
                    >
                      Developer Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-black"></span>
                      How to connect your TikTok account:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-slate-600 text-xs">
                      <li>Log in to <a href="https://developers.tiktok.com/" target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline">developers.tiktok.com</a> and create a Developer App.</li>
                      <li>Add the <strong>Content Posting API</strong> product to your app.</li>
                      <li>Ensure your scope includes <code className="px-1.5 py-0.5 bg-slate-100 text-black font-bold rounded">video.upload</code> and <code className="px-1.5 py-0.5 bg-slate-100 text-black font-bold rounded">video.publish</code>.</li>
                      <li>In the form, enter your TikTok <strong>OpenID</strong> (or handle like <code className="px-1.5 py-0.5 bg-slate-100 font-mono">@your_username</code>) and paste your generated <strong>Access Token</strong>.</li>
                      <li><em>Instant Testing Tip:</em> Click <strong>&quot;Fill Demo Test Credentials&quot;</strong> to immediately connect a verified TikTok creator profile without waiting for app reviews!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Developer Privacy Policy & Terms Link */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-indigo-900 mt-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    When creating your Meta/LinkedIn app, use this <strong>Privacy Policy URL</strong>:{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700 font-mono font-bold">
                      /privacy
                    </code>
                  </span>
                </div>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1"
                >
                  View Policy Page <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Got it, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}