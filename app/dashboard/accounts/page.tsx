'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Loader2,
  Sparkles
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
          platform: 'FACEBOOK',
          pageId,
          accessToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to connect Facebook Page' });
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
    setPageId('TEST_PAGE_' + Math.floor(1000 + Math.random() * 9000));
    setAccessToken('TEST_ACCESS_TOKEN_SIMULATED');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Connected Accounts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect your Facebook Pages to schedule content and automate first comments.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
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
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Connect Facebook Page
            </h2>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Guide
            </button>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Facebook Page ID
              </label>
              <input
                type="text"
                required
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="e.g. 102938475610293"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Page Access Token
              </label>
              <textarea
                required
                rows={3}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAG... (Graph API Page Access Token)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying with Facebook...
                </>
              ) : (
                <>
                  Connect Page
                </>
              )}
            </button>

            <button
              type="button"
              onClick={fillSimulatedDemo}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-200 text-xs text-indigo-700 font-medium hover:bg-indigo-50/50 flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Use Simulated Demo Page (Instant Test)
            </button>
          </form>

          {/* Setup Guide */}
          {showGuide && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-900">How to get credentials:</p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-indigo-600 underline inline-flex items-center gap-0.5">Meta Graph API Explorer <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li>Under <strong>User or Page</strong>, select your Facebook Page.</li>
                <li>Add permissions: <code className="bg-slate-200 px-1 rounded text-[11px]">pages_manage_posts</code> and <code className="bg-slate-200 px-1 rounded text-[11px]">pages_read_engagement</code>.</li>
                <li>Click <strong>Generate Access Token</strong> and grant access.</li>
                <li>Copy the <strong>Page ID</strong> and <strong>Access Token</strong> into the form above.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Right: Connected Accounts List (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="font-bold text-base text-slate-900 mb-4">
            Active Connected Pages ({accounts.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Share2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No Facebook Pages Connected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Connect a Facebook page using the form on the left or try the simulated test mode.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 overflow-hidden">
                      {acc.avatar ? (
                        <img src={acc.avatar} alt={acc.name} className="h-full w-full object-cover" />
                      ) : (
                        acc.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-slate-900 truncate">
                          {acc.name}
                        </h3>
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                          {acc.platform}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        Page ID: <span className="font-mono text-[11px] text-slate-500">{acc.accountId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDisconnect(acc.id)}
                      title="Disconnect Account"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}