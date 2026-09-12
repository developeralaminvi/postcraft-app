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
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Guide Popup Modal state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN'>('FACEBOOK');

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

  const openGuide = (selectedPlatform?: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN') => {
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
            ফেসবুক, ইনস্টাগ্রাম এবং লিঙ্কডইন পেজ বা পার্সোনাল প্রোফাইল খুব সহজেই কানেক্ট করুন।
          </p>
        </div>

        {/* Prominent Guide Button */}
        <button
          type="button"
          onClick={() => openGuide(platform)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition shadow-2xs cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>কানেক্ট করার গাইড দেখুন (How to Connect)</span>
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
              প্ল্যাটফর্ম নির্বাচন করুন
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
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Connect {platform === 'LINKEDIN' ? 'LinkedIn' : platform === 'INSTAGRAM' ? 'Instagram' : 'Facebook'}
            </h2>
            <button
              type="button"
              onClick={() => openGuide(platform)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> কিভাবে নিবেন?
            </button>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            {/* Account / Page ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" />
                {platform === 'LINKEDIN'
                  ? 'LinkedIn Member URN বা Org ID'
                  : platform === 'INSTAGRAM'
                  ? 'Instagram Business বা Creator ID'
                  : 'Facebook Page ID বা User ID'}
              </label>
              <input
                type="text"
                required
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder={
                  platform === 'LINKEDIN'
                    ? 'urn:li:person:... অথবা urn:li:organization:... (বা me)'
                    : platform === 'INSTAGRAM'
                    ? 'e.g. 17841405309214589'
                    : 'e.g. 102938475610293 (পেজ আইডি) বা me'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-xs text-slate-900 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {platform === 'LINKEDIN'
                  ? 'কোম্পানি পেজ কানেক্ট করতে পেজের আইডি সংখ্যা (যেমন: 12345678) অথবা লিঙ্ক দিন। ব্যক্তিগত প্রোফাইলের জন্য me লিখুন।'
                  : platform === 'INSTAGRAM'
                  ? 'আপনার Instagram Business বা Creator অ্যাকাউন্টের আইডি'
                  : 'ফেসবুক পেজ আইডি অথবা ব্যক্তিগত অ্যাকাউন্টের জন্য সরাসরি me লিখুন'}
              </p>
            </div>

            {/* Access Token */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Key className="w-3 h-3 text-slate-400" />
                Access Token
              </label>
              <textarea
                required
                rows={3}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={
                  platform === 'LINKEDIN'
                    ? 'AQ... (LinkedIn OAuth 2.0 Access Token)'
                    : platform === 'INSTAGRAM'
                    ? 'EAAG... (Meta Graph API Access Token)'
                    : 'EAAG... (Facebook Page বা User Access Token)'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-xs text-slate-900 bg-white leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer ${
                platform === 'LINKEDIN'
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
                  Connect {platform} Account
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
              এক ক্লিকে টেস্ট ডেমো অ্যাকাউন্ট বসান (Instant Test)
            </button>
          </form>
        </div>

        {/* Right: Connected Channels List (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-slate-900">
              Active Connected Channels ({accounts.length})
            </h2>
            <span className="text-xs text-slate-400">পোস্ট করার জন্য সক্রিয় চ্যানেল</span>
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
              <p className="text-sm font-semibold text-slate-800">কোনো সোশ্যাল চ্যানেল কানেক্ট করা নেই</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                বামপাশের ফর্ম দিয়ে ফেসবুক, ইনস্টাগ্রাম বা লিঙ্কডইন অ্যাকাউন্ট কানেক্ট করুন অথবা টেস্ট বাটন চাপুন।
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
                              isPersonal
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
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
                    সোশ্যাল অ্যাকাউন্ট API কানেক্ট করার সহজ গাইড
                  </h3>
                  <p className="text-xs text-slate-500">
                    কিভাবে আইডি এবং অ্যাক্সেস টোকেন পাবেন তা নিচে ধাপে ধাপে বুঝিয়ে দেওয়া হয়েছে।
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
                <Share2 className="w-3.5 h-3.5" /> Facebook গাইড
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
                <Instagram className="w-3.5 h-3.5" /> Instagram গাইড
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
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn গাইড
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
              {guidePlatform === 'FACEBOOK' && (
                <div className="space-y-4">
                  {/* Step 1: Tool link */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-blue-950 text-sm">১. Meta Graph API Explorer ওপেন করুন</p>
                      <p className="text-blue-800 text-xs mt-0.5">
                        মেটার অফিসিয়াল টুল থেকে কয়েক ক্লিকেই টোকেন ও আইডি পাওয়া যায়।
                      </p>
                    </div>
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 text-xs flex-shrink-0 shadow-2xs"
                    >
                      Explorer লিংক <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Option A: Page */}
                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      ফেসবুক পেজ (Facebook Page) কানেক্ট করার নিয়ম:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>Graph API Explorer-এ যান এবং ডানপাশে <strong>User or Page</strong> ড্রপডাউন থেকে আপনার <strong>Facebook Page</strong> টি নির্বাচন করুন।</li>
                      <li><strong>Add Permission</strong> থেকে <code className="px-1.5 py-0.5 bg-slate-100 text-indigo-600 rounded font-mono">pages_manage_posts</code> এবং <code className="px-1.5 py-0.5 bg-slate-100 text-indigo-600 rounded font-mono">pages_read_engagement</code> পারমিশন যুক্ত করুন।</li>
                      <li><strong>Generate Access Token</strong> বাটনে ক্লিক করে ফেসবুক লগইন করে পারমিশন অ্যাপ্রুভ করুন।</li>
                      <li>স্ক্রিনে যে <strong>Access Token</strong> আসবে তা কপি করে টোকেন বক্সে দিন এবং আপনার পেজ আইডিটি আইডি বক্সে বসিয়ে Connect চাপুন।</li>
                    </ol>
                  </div>

                  {/* Option B: Profile */}
                  <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      ব্যক্তিগত ফেসবুক প্রোফাইল (Personal Profile) কানেক্ট করার নিয়ম:
                    </p>
                    <p className="text-slate-600">
                      Explorer-এ User Token নির্বাচন করুন। আইডি বক্সে সরাসরি <code className="px-1.5 py-0.5 bg-purple-50 text-purple-700 font-bold rounded">me</code> অথবা আপনার প্রোফাইল আইডি দিন এবং জেনারেট করা User Access Token কপি করে বসিয়ে দিন।
                    </p>
                  </div>
                </div>
              )}

              {guidePlatform === 'INSTAGRAM' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-pink-950 text-sm">ইনস্টাগ্রাম কানেক্ট করার প্রাথমিক শর্ত</p>
                      <p className="text-pink-800 text-xs mt-0.5">
                        অ্যাকাউন্টটি <strong>Professional (Business বা Creator)</strong> অ্যাকাউন্ট হতে হবে এবং একটি ফেসবুক পেজের সাথে লিংক করা থাকতে হবে।
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
                    <p className="font-bold text-slate-900 text-xs">ধাপে ধাপে ইনস্টাগ্রাম কানেক্ট করার পদ্ধতি:</p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>আপনার ইনস্টাগ্রাম অ্যাকাউন্টকে মোবাইল অ্যাপ থেকে Professional Account-এ সুইচ করুন (Settings &gt; Account &gt; Switch to Professional)।</li>
                      <li>ফেসবুক পেজ সেটিংসে গিয়ে ইনস্টাগ্রাম অ্যাকাউন্টটি পেজের সাথে লিংক করুন।</li>
                      <li><a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-pink-600 font-semibold underline">Meta Graph API Explorer</a>-এ যান।</li>
                      <li>পারমিশন হিসেবে <code className="px-1.5 py-0.5 bg-slate-100 text-pink-600 rounded font-mono">instagram_basic</code> এবং <code className="px-1.5 py-0.5 bg-slate-100 text-pink-600 rounded font-mono">instagram_content_publish</code> যোগ করুন।</li>
                      <li>টোকেন জেনারেট করে আপনার Instagram Account ID এবং Access Token বক্সে পেস্ট করে Connect বাটনে ক্লিক করুন।</li>
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
                        লিঙ্কডইনের পার্সোনাল প্রোফাইল বা কোম্পানি পেজের টোকেন নেওয়ার লিঙ্ক।
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
                      ১. ব্যক্তিগত প্রোফাইল (Personal Profile):
                    </p>
                    <p className="text-slate-600 pl-3.5">
                      ব্যক্তিগত প্রোফাইলের জন্য কোনো কঠিন আইডি লাগবে না—আইডির ঘরে শুধু <code className="px-1.5 py-0.5 bg-blue-50 text-[#0A66C2] font-bold rounded">me</code> লিখুন এবং আপনার জেনারেট করা Access Token দিয়ে কানেক্ট চাপুন।
                    </p>

                    <div className="pt-2 border-t border-slate-100"></div>

                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0A66C2]"></span>
                      ২. কোম্পানি পেজ আইডি (Company Page ID) কোথায় পাবেন:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                      <li>লিঙ্কডইনে লগইন করে আপনার কোম্পানি পেজের <strong>Admin View</strong>-তে যান।</li>
                      <li>ব্রাউজারের অ্যাড্রেস বারের লিঙ্কটি খেয়াল করুন: <code className="px-1 py-0.5 bg-slate-100 text-slate-800 rounded font-mono">linkedin.com/company/<strong>12345678</strong>/admin/...</code></li>
                      <li>এখানে <code className="px-1 py-0.5 bg-blue-50 text-[#0A66C2] font-bold rounded">/company/</code> এর ঠিক পরের <strong>সংখ্যাটি (যেমন: 12345678)</strong> হলো আপনার পেজ আইডি!</li>
                      <li>আপনি সরাসরি এই সংখ্যাটি অথবা পুরো পেজের লিঙ্কটি আমাদের আইডি ঘরে পেস্ট করতে পারেন (সিস্টেম অটোমেটিক আইডি চিনে নিবে)।</li>
                      <li>টোকেন নেওয়ার সময় <code className="px-1.5 py-0.5 bg-slate-100 text-[#0A66C2] rounded font-mono">w_organization_social</code> পারমিশন সিলেক্ট করে টোকেন নিন।</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Developer Privacy Policy & Terms Link */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-indigo-900 mt-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    অ্যাপ তৈরির সময় <strong>Privacy Policy URL</strong> চাইলে দিন:{' '}
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
                  পলিসি পেজ দেখুন <ExternalLink className="w-3 h-3" />
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
                বুঝেছি, বন্ধ করুন (Got it)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}