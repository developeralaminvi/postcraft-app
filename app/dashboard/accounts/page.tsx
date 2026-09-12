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
  HelpCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  User,
  Building2,
  Info,
} from 'lucide-react';

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
  const [platform, setPlatform] = useState<'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN'>('FACEBOOK');
  const [accountType, setAccountType] = useState<'PROFILE' | 'PAGE'>('PROFILE');
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

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
          accountType,
          pageId: pageId.trim(),
          accessToken: accessToken.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed to connect ${platform}` });
        return;
      }

      setMessage({ type: 'success', text: data.message });
      setPageId('');
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
    if (platform === 'LINKEDIN') {
      if (accountType === 'PROFILE') {
        setPageId(`urn:li:person:TEST_LI_USER_${randomId}`);
        setAccessToken('TEST_LINKEDIN_MEMBER_TOKEN');
      } else {
        setPageId(`urn:li:organization:TEST_LI_ORG_${randomId}`);
        setAccessToken('TEST_LINKEDIN_ORG_TOKEN');
      }
    } else if (platform === 'INSTAGRAM') {
      if (accountType === 'PROFILE') {
        setPageId(`TEST_IG_CREATOR_${randomId}`);
        setAccessToken('TEST_INSTAGRAM_CREATOR_TOKEN');
      } else {
        setPageId(`TEST_IG_BIZ_${randomId}`);
        setAccessToken('TEST_INSTAGRAM_BIZ_TOKEN');
      }
    } else {
      // Facebook
      if (accountType === 'PROFILE') {
        setPageId(`TEST_FB_USER_${randomId}`);
        setAccessToken('TEST_FB_USER_TOKEN');
      } else {
        setPageId(`TEST_FB_PAGE_${randomId}`);
        setAccessToken('TEST_FB_PAGE_TOKEN');
      }
    }
  };

  const isProfile = accountType === 'PROFILE';

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Connected Accounts & Profiles</h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect your Personal Profiles, Pages, and Business Channels across Facebook, Instagram, and LinkedIn.
        </p>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Connect Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-5">
          {/* Step 1: Platform Tab Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              1. Choose Platform
            </label>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPlatform('FACEBOOK')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  platform === 'FACEBOOK'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" /> Facebook
              </button>
              <button
                type="button"
                onClick={() => setPlatform('INSTAGRAM')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  platform === 'INSTAGRAM'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </button>
              <button
                type="button"
                onClick={() => setPlatform('LINKEDIN')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  platform === 'LINKEDIN'
                    ? 'bg-[#0A66C2] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </button>
            </div>
          </div>

          {/* Step 2: Account Type Switcher (Personal Profile vs Business Page) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              2. Account Type (ব্যক্তিগত প্রোফাইল নাকি পেজ)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('PROFILE')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isProfile
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-2xs ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Personal Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('PAGE')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  !isProfile
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-2xs ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{platform === 'LINKEDIN' ? 'Company Page' : 'Business Page'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              Connect {platform} {isProfile ? 'Personal Profile' : 'Page'}
            </h2>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Guide
            </button>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {platform === 'LINKEDIN'
                  ? isProfile
                    ? 'LinkedIn Member URN / ID'
                    : 'LinkedIn Organization URN'
                  : platform === 'INSTAGRAM'
                  ? isProfile
                    ? 'Instagram Creator / User ID'
                    : 'Instagram Business ID'
                  : isProfile
                  ? "Facebook User ID (বা 'me')"
                  : 'Facebook Page ID'}
              </label>
              <input
                type="text"
                required
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder={
                  platform === 'LINKEDIN'
                    ? isProfile
                      ? 'urn:li:person:... or me'
                      : 'urn:li:organization:123456'
                    : platform === 'INSTAGRAM'
                    ? isProfile
                      ? 'e.g. 17841405309214589 or username'
                      : 'e.g. 17841405309214589'
                    : isProfile
                    ? "e.g. me or 100084729102938"
                    : 'e.g. 102938475610293'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {platform === 'LINKEDIN'
                  ? isProfile
                    ? 'LinkedIn User OAuth Token (with w_member_social)'
                    : 'LinkedIn Page Token (with w_organization_social)'
                  : platform === 'INSTAGRAM'
                  ? 'Meta Graph API Access Token'
                  : isProfile
                  ? 'Facebook User Access Token'
                  : 'Facebook Page Access Token'}
              </label>
              <textarea
                required
                rows={3}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={
                  platform === 'LINKEDIN'
                    ? 'AQ... (LinkedIn OAuth 2.0 Access Token)'
                    : 'EAAG... (Meta Graph API Access Token)'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-xs text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer ${
                platform === 'LINKEDIN'
                  ? 'bg-[#0A66C2] hover:bg-[#004182]'
                  : platform === 'INSTAGRAM'
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying {platform}...
                </>
              ) : (
                <>
                  Connect {platform} {isProfile ? 'Personal Profile' : 'Page'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={fillSimulatedDemo}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-200 text-xs text-indigo-700 font-medium hover:bg-indigo-50/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Use Simulated {platform} {isProfile ? 'Personal Profile' : 'Page'} (Instant Test)
            </button>
          </form>

          {/* Setup Guide */}
          {showGuide && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2.5 leading-relaxed animate-in fade-in">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                How to connect {platform} ({isProfile ? 'Personal Profile' : 'Page'}):
              </p>
              {platform === 'LINKEDIN' ? (
                isProfile ? (
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Create an app in the <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer" className="text-blue-600 underline inline-flex items-center gap-0.5">LinkedIn Developer Portal <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
                    <li>Add product: <em>Share on LinkedIn</em> and <em>Sign In with LinkedIn using OpenID Connect</em>.</li>
                    <li>Scopes required for Personal Profile: <code className="bg-slate-200 px-1 rounded text-[11px]">w_member_social</code>, <code className="bg-slate-200 px-1 rounded text-[11px]">openid</code>, <code className="bg-slate-200 px-1 rounded text-[11px]">profile</code>.</li>
                    <li>Member URN can be found via UserInfo or pass <code className="bg-slate-200 px-1 rounded text-[11px]">me</code>.</li>
                  </ol>
                ) : (
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>In LinkedIn Developer Portal, add product <em>Community Management API</em>.</li>
                    <li>Scope for Company Page: <code className="bg-slate-200 px-1 rounded text-[11px]">w_organization_social</code>.</li>
                    <li>Organization URN format: <code className="bg-slate-200 px-1 rounded text-[11px]">urn:li:organization:123456</code>.</li>
                  </ol>
                )
              ) : platform === 'INSTAGRAM' ? (
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Ensure your Instagram profile is switched to a <strong>Professional (Business or Creator)</strong> account.</li>
                  <li>In Meta Graph API Explorer, select your Instagram account.</li>
                  <li>Permissions: <code className="bg-slate-200 px-1 rounded text-[11px]">instagram_basic</code>, <code className="bg-slate-200 px-1 rounded text-[11px]">instagram_content_publish</code>.</li>
                  <li>Copy your Account ID and Token.</li>
                </ol>
              ) : isProfile ? (
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Visit <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-indigo-600 underline inline-flex items-center gap-0.5">Meta Graph API Explorer <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
                  <li>Under <strong>User or Page</strong>, select <strong>User Token</strong>.</li>
                  <li>Enter <code className="bg-slate-200 px-1 rounded text-[11px]">me</code> as User ID and copy the User Access Token.</li>
                  <li>💡 <em>Note:</em> Facebook allows reading profile and testing posts. For official auto-publishing on personal accounts, Meta recommends Facebook Pages.</li>
                </ol>
              ) : (
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-indigo-600 underline inline-flex items-center gap-0.5">Meta Graph API Explorer <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
                  <li>Under <strong>User or Page</strong>, select your Facebook Page.</li>
                  <li>Permissions: <code className="bg-slate-200 px-1 rounded text-[11px]">pages_manage_posts</code> and <code className="bg-slate-200 px-1 rounded text-[11px]">pages_read_engagement</code>.</li>
                  <li>Click <strong>Generate Access Token</strong> and grant access.</li>
                </ol>
              )}
            </div>
          )}
        </div>

        {/* Right: Connected Accounts List (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-slate-900">
              Active Connected Channels ({accounts.length})
            </h2>
            <span className="text-xs text-slate-400">
              Profiles & Pages ready for multi-posting
            </span>
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
              <p className="text-sm font-semibold text-slate-800">No Social Channels Connected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Connect a Personal Profile or Page using the form on the left or test instantly using the simulated button.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => {
                const isPersonal = acc.category?.toLowerCase().includes('profile');

                return (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between gap-4"
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
                          {/* Account Type Badge (Profile vs Page) */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isPersonal
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isPersonal ? '👤 Personal Profile' : '🏢 Page'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          ID: <span className="font-mono text-[11px] text-slate-500">{acc.accountId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDisconnect(acc.id)}
                        title="Disconnect Account"
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
    </div>
  );
}