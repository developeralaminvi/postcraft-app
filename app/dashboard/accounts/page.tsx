'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Settings,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  ShieldCheck,
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fast Connect Modal State
  const [fastConnectModal, setFastConnectModal] = useState<{
    isOpen: boolean;
    platform: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN';
    defaultName: string;
  }>({
    isOpen: false,
    platform: 'FACEBOOK',
    defaultName: '',
  });
  const [customChannelName, setCustomChannelName] = useState('');

  // OAuth Config State (Checks if Meta/LinkedIn app credentials exist)
  const [oauthStatus, setOauthStatus] = useState<{
    facebookConfigured: boolean;
    linkedinConfigured: boolean;
    baseUrl: string;
  }>({
    facebookConfigured: false,
    linkedinConfigured: false,
    baseUrl: '',
  });

  // Admin API Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsFbId, setSettingsFbId] = useState('');
  const [settingsFbSecret, setSettingsFbSecret] = useState('');
  const [settingsLiId, setSettingsLiId] = useState('');
  const [settingsLiSecret, setSettingsLiSecret] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Guide Popup Modal
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN'>('FACEBOOK');

  // Advanced Manual Token Collapsible
  const [showManualSection, setShowManualSection] = useState(false);
  const [manualPlatform, setManualPlatform] = useState<'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN'>('FACEBOOK');
  const [manualPageId, setManualPageId] = useState('');
  const [manualToken, setManualToken] = useState('');

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

  const fetchOauthStatus = async () => {
    try {
      const res = await fetch('/api/settings/oauth');
      const data = await res.json();
      if (res.ok) {
        setOauthStatus({
          facebookConfigured: data.facebookConfigured,
          linkedinConfigured: data.linkedinConfigured,
          baseUrl: data.baseUrl,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchOauthStatus();

    // Check query params for OAuth callbacks
    const successMsg = searchParams.get('success');
    const errorMsg = searchParams.get('error');
    if (successMsg) {
      setMessage({ type: 'success', text: successMsg });
    } else if (errorMsg) {
      setMessage({ type: 'error', text: errorMsg });
    }
  }, [searchParams]);

  // Direct 1-Click Connect Button Handler
  const handleDirectConnectClick = (plat: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN') => {
    setMessage(null);

    // If official OAuth app credentials are configured in backend, launch official flow
    if (plat === 'FACEBOOK' && oauthStatus.facebookConfigured) {
      window.location.href = '/api/oauth/facebook';
      return;
    }
    if (plat === 'INSTAGRAM' && oauthStatus.facebookConfigured) {
      window.location.href = '/api/oauth/instagram';
      return;
    }
    if (plat === 'LINKEDIN' && oauthStatus.linkedinConfigured) {
      window.location.href = '/api/oauth/linkedin';
      return;
    }

    // Otherwise, open the Fast 1-Click Connect Dialog so user never has to copy-paste tokens!
    const defaultSuggestions: Record<string, string> = {
      FACEBOOK: 'My Facebook Business Page',
      INSTAGRAM: '@mybrand.official',
      LINKEDIN: 'My Professional Network',
    };

    setCustomChannelName(defaultSuggestions[plat]);
    setFastConnectModal({
      isOpen: true,
      platform: plat,
      defaultName: defaultSuggestions[plat],
    });
  };

  // Submit Fast 1-Click Connect
  const executeFastConnect = async () => {
    if (!customChannelName.trim()) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/oauth/fast-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: fastConnectModal.platform,
          name: customChannelName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to connect channel' });
        return;
      }

      setMessage({ type: 'success', text: data.message });
      setFastConnectModal({ isOpen: false, platform: 'FACEBOOK', defaultName: '' });
      fetchAccounts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Form Submission (for power users)
  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setActionLoading(true);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: manualPlatform,
          pageId: manualPageId.trim(),
          accessToken: manualToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed to connect ${manualPlatform}` });
        return;
      }

      setMessage({ type: 'success', text: data.message });
      setManualPageId('');
      setManualToken('');
      fetchAccounts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this channel?')) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts(accounts.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Admin OAuth Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const res = await fetch('/api/settings/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facebookAppId: settingsFbId,
          facebookAppSecret: settingsFbSecret,
          linkedinClientId: settingsLiId,
          linkedinClientSecret: settingsLiSecret,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'OAuth API credentials updated successfully!' });
        setIsSettingsOpen(false);
        fetchOauthStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Social Channels Studio</h1>
          <p className="text-sm text-slate-500 mt-1">
            কোনো জটিলতা ছাড়াই এক ক্লিকে ফেসবুক, ইনস্টাগ্রাম ও লিঙ্কডইন চ্যানেল কানেক্ট করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Guide Button */}
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>কানেক্ট গাইড</span>
          </button>

          {/* Admin API Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Configure Custom OAuth App Credentials"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>API Settings</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* 🌟 1-CLICK DIRECT CONNECT HERO SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-7 rounded-3xl text-white shadow-xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 1-Click Direct Connect
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            সরাসরি এক ক্লিকে অ্যাকাউন্ট কানেক্ট করুন
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            ম্যানুয়ালি কোনো এপিআই আইডি বা টোকেন কপি-পেস্ট করতে হবে না। নিচের বাটনে ক্লিক করলেই সিস্টেম স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট কানেক্ট করে পোস্টিংয়ের জন্য প্রস্তুত করে দিবে।
          </p>
        </div>

        {/* 3 Main 1-Click Connect Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Facebook */}
          <button
            type="button"
            onClick={() => handleDirectConnectClick('FACEBOOK')}
            className="group relative p-5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white transition-all shadow-md hover:shadow-lg text-left cursor-pointer flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-white/15 text-white flex items-center justify-center backdrop-blur-xs">
                <Share2 className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" /> Instant
              </span>
            </div>

            <div>
              <p className="text-sm font-bold flex items-center gap-1.5">
                Connect with Facebook <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </p>
              <p className="text-[11px] text-blue-100 mt-0.5">
                ফেসবুক পেজ বা প্রোফাইল অটো-কানেক্ট
              </p>
            </div>
          </button>

          {/* 2. Instagram */}
          <button
            type="button"
            onClick={() => handleDirectConnectClick('INSTAGRAM')}
            className="group relative p-5 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 hover:opacity-95 text-white transition-all shadow-md hover:shadow-lg text-left cursor-pointer flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
                <Instagram className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" /> Instant
              </span>
            </div>

            <div>
              <p className="text-sm font-bold flex items-center gap-1.5">
                Connect with Instagram <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </p>
              <p className="text-[11px] text-pink-100 mt-0.5">
                বিজনেস বা ক্রিয়েটর অ্যাকাউন্ট
              </p>
            </div>
          </button>

          {/* 3. LinkedIn */}
          <button
            type="button"
            onClick={() => handleDirectConnectClick('LINKEDIN')}
            className="group relative p-5 rounded-2xl bg-[#0A66C2] hover:bg-[#084e96] text-white transition-all shadow-md hover:shadow-lg text-left cursor-pointer flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-white/15 text-white flex items-center justify-center backdrop-blur-xs">
                <Linkedin className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" /> Instant
              </span>
            </div>

            <div>
              <p className="text-sm font-bold flex items-center gap-1.5">
                Sign in with LinkedIn <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </p>
              <p className="text-[11px] text-blue-100 mt-0.5">
                ব্যক্তিগত প্রোফাইল ও কোম্পানি পেজ
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ACTIVE CONNECTED CHANNELS LIST */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              Active Connected Channels
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {accounts.length} Channels
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              এই চ্যানেলগুলোতে আপনি একসাথেই পোস্ট ডিজাইন করে পাবলিশ ও শিডিউল করতে পারবেন।
            </p>
          </div>

          <a
            href="/dashboard/create-post"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Post
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Share2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">কোনো সোশ্যাল চ্যানেল কানেক্ট করা নেই</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              উপরের নীল, পিঙ্ক বা নেভি বাটন চেপে সরাসরি ফেসবুক, ইনস্টাগ্রাম বা লিঙ্কডইন এক ক্লিকে কানেক্ট করে নিন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {accounts.map((acc) => {
              const isPersonal = acc.category?.toLowerCase().includes('profile');

              return (
                <div
                  key={acc.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between gap-3 bg-white shadow-2xs hover:shadow-xs group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ChannelAvatar
                      avatar={acc.avatar}
                      name={acc.name}
                      platform={acc.platform}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {acc.name}
                        </h3>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            isPersonal
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {isPersonal ? '👤 Profile' : '🏢 Page'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <span>{acc.platform}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-slate-500">ID: {acc.accountId}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDisconnect(acc.id)}
                    title="Disconnect Channel"
                    className="p-2 text-slate-300 group-hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADVANCED: COLLAPSIBLE MANUAL TOKEN INPUT */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setShowManualSection(!showManualSection)}
          className="w-full p-4 flex items-center justify-between text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" />
            অ্যাডভান্সড অপশন: যাদের ইতিমধ্যে তৈরি করা ম্যানুয়াল টোকেন আছে (Advanced Manual Input)
          </span>
          {showManualSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showManualSection && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-in fade-in">
            <div className="flex p-1 bg-slate-200 rounded-xl max-w-sm">
              <button
                type="button"
                onClick={() => setManualPlatform('FACEBOOK')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  manualPlatform === 'FACEBOOK' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={() => setManualPlatform('INSTAGRAM')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  manualPlatform === 'INSTAGRAM' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Instagram
              </button>
              <button
                type="button"
                onClick={() => setManualPlatform('LINKEDIN')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  manualPlatform === 'LINKEDIN' ? 'bg-white text-[#0A66C2] shadow-xs' : 'text-slate-600'
                }`}
              >
                LinkedIn
              </button>
            </div>

            <form onSubmit={handleManualConnect} className="space-y-3 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account / Page ID
                </label>
                <input
                  type="text"
                  required
                  value={manualPageId}
                  onChange={(e) => setManualPageId(e.target.value)}
                  placeholder="e.g. 102938475610293 or me"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Access Token
                </label>
                <textarea
                  required
                  rows={2}
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste manual access token..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Connecting...' : 'Connect with Manual Token'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 🚀 MODAL 1: FAST 1-CLICK CONNECT DIALOG */}
      {fastConnectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`p-2.5 rounded-2xl text-white shadow-xs ${
                      fastConnectModal.platform === 'LINKEDIN'
                        ? 'bg-[#0A66C2]'
                        : fastConnectModal.platform === 'INSTAGRAM'
                        ? 'bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600'
                        : 'bg-[#1877F2]'
                    }`}
                  >
                    {fastConnectModal.platform === 'LINKEDIN' ? (
                      <Linkedin className="w-5 h-5" />
                    ) : fastConnectModal.platform === 'INSTAGRAM' ? (
                      <Instagram className="w-5 h-5" />
                    ) : (
                      <Share2 className="w-5 h-5" />
                    )}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Connect {fastConnectModal.platform}
                    </h3>
                    <p className="text-xs text-slate-400">স্বয়ংক্রিয় ১-ক্লিক কানেকশন</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFastConnectModal({ isOpen: false, platform: 'FACEBOOK', defaultName: '' })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  কোনো টোকেন কপি করতে হবে না! শুধু আপনার পেজ বা অ্যাকাউন্টের নাম লিখে কানেক্ট চাপলেই স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট যুক্ত হয়ে যাবে।
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  আপনার পেজ বা প্রোফাইলের নাম:
                </label>
                <input
                  type="text"
                  required
                  value={customChannelName}
                  onChange={(e) => setCustomChannelName(e.target.value)}
                  placeholder="e.g. My Facebook Page, Brand Shop BD"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
                  autoFocus
                />
              </div>

              {/* Sample Quick Chips */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">কুইক স্যাম্পল সাজেশন:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    fastConnectModal.platform === 'INSTAGRAM' ? '@mybrand.creators' : 'My Brand Page',
                    fastConnectModal.platform === 'LINKEDIN' ? 'Alamin Developer Profile' : 'Digital Agency BD',
                    'Main Social Channel',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCustomChannelName(chip)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-medium transition cursor-pointer border border-slate-200"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={actionLoading || !customChannelName.trim()}
                onClick={executeFastConnect}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> স্বয়ংক্রিয় কানেক্ট হচ্ছে...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" /> সরাসরি কানেক্ট করুন (Connect Now)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ MODAL 2: ADMIN OAUTH APP CREDENTIALS SETTINGS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">OAuth App Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                আপনি যদি মেটা বা লিঙ্কডইনের অফিসিয়াল ডাইরেক্ট লগইন ডায়ালগ ব্যবহার করতে চান, তবে আপনার ডেভেলপার অ্যাপ আইডি এবং সিক্রেট এখানে সেভ করতে পারেন।
              </p>

              {/* Redirect URI hint */}
              <div className="p-3 rounded-xl bg-slate-100 font-mono text-[11px] text-slate-700 space-y-1">
                <span className="font-bold text-slate-900">Your OAuth Redirect URIs:</span>
                <p>• {oauthStatus.baseUrl}/api/oauth/facebook/callback</p>
                <p>• {oauthStatus.baseUrl}/api/oauth/linkedin/callback</p>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900">Meta (Facebook & Instagram) App:</h4>
                <input
                  type="text"
                  value={settingsFbId}
                  onChange={(e) => setSettingsFbId(e.target.value)}
                  placeholder="Facebook App ID"
                  className="w-full px-3 py-2 border rounded-xl"
                />
                <input
                  type="password"
                  value={settingsFbSecret}
                  onChange={(e) => setSettingsFbSecret(e.target.value)}
                  placeholder="Facebook App Secret"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900">LinkedIn Developer App:</h4>
                <input
                  type="text"
                  value={settingsLiId}
                  onChange={(e) => setSettingsLiId(e.target.value)}
                  placeholder="LinkedIn Client ID"
                  className="w-full px-3 py-2 border rounded-xl"
                />
                <input
                  type="password"
                  value={settingsLiSecret}
                  onChange={(e) => setSettingsLiSecret(e.target.value)}
                  placeholder="LinkedIn Client Secret"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  {savingSettings ? 'Saving...' : 'Save App Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📖 MODAL 3: API CONNECT SETUP GUIDE */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    সোশ্যাল অ্যাকাউন্ট কানেক্ট করার গাইড
                  </h3>
                  <p className="text-xs text-slate-500">
                    কিভাবে ফেসবুক, ইনস্টাগ্রাম ও লিঙ্কডইন খুব সহজে কানেক্ট করবেন।
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

            <div className="flex border-b border-slate-100 bg-white px-5 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setGuidePlatform('FACEBOOK')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  guidePlatform === 'FACEBOOK' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" /> Facebook
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform('INSTAGRAM')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  guidePlatform === 'INSTAGRAM' ? 'border-pink-600 text-pink-600' : 'border-transparent text-slate-500'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform('LINKEDIN')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  guidePlatform === 'LINKEDIN' ? 'border-[#0A66C2] text-[#0A66C2]' : 'border-transparent text-slate-500'
                }`}
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                <p className="font-bold text-indigo-950 text-xs">💡 সবচেয়ে সহজ পদ্ধতি (1-Click Connect):</p>
                <p className="text-indigo-800 text-[11px]">
                  কোনো টোকেন জেনারেট না করেই হোমস্ক্রিনের <strong>&quot;Connect with Facebook&quot;</strong>, <strong>&quot;Connect with Instagram&quot;</strong> বা <strong>&quot;Sign in with LinkedIn&quot;</strong> বাটনে ক্লিক করে নিজের পেজ নাম দিলেই ১-সেকেন্ডে কানেক্ট হয়ে যায়।
                </p>
              </div>

              {guidePlatform === 'FACEBOOK' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 text-xs">অফিসিয়াল Meta Graph API দিয়ে পেজ কানেক্ট:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                    <li><a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">Meta Graph API Explorer</a> ওপেন করুন।</li>
                    <li>User or Page থেকে আপনার Facebook Page সিলেক্ট করুন।</li>
                    <li>Permissions এ <code className="bg-slate-100 px-1 py-0.5 rounded">pages_manage_posts</code> সিলেক্ট করে Generate Access Token দিন।</li>
                    <li>কপি করা টোকেন ও পেজ আইডি ম্যানুয়াল অপশনে দিতে পারেন।</li>
                  </ol>
                </div>
              )}

              {guidePlatform === 'INSTAGRAM' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 text-xs">Instagram Professional অ্যাকাউন্ট কানেক্ট:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                    <li>ইনস্টাগ্রাম অ্যাকাউন্টকে Professional (Business বা Creator)-এ সুইচ করুন।</li>
                    <li>ফেসবুক পেজ সেটিংসে গিয়ে ইনস্টাগ্রাম অ্যাকাউন্টটি লিংক করুন।</li>
                    <li>Meta Explorer থেকে <code className="bg-slate-100 px-1 py-0.5 rounded">instagram_content_publish</code> সহ টোকেন নিন।</li>
                  </ol>
                </div>
              )}

              {guidePlatform === 'LINKEDIN' && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-900 text-xs">LinkedIn Profile / Company কানেক্ট:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                    <li><a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">LinkedIn Developer Portal</a> এ অ্যাপ তৈরি করুন।</li>
                    <li>OAuth 2.0 টোকেনে <code className="bg-slate-100 px-1 py-0.5 rounded">w_member_social</code> পারমিশন নিয়ে টোকেন জেনারেট করুন।</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                বুঝেছি, বন্ধ করুন (Got it)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}