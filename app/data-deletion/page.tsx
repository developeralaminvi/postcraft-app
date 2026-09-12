'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  Mail,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export default function DataDeletionPage() {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">PostCraft</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Deletion URL</span>
                </>
              )}
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 shadow-xs">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <Trash2 className="w-3.5 h-3.5" /> Meta Platform Compliance
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              User Data Deletion Instructions
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Guidance on removing your personal data, access tokens, and social media authorizations.
            </p>
          </div>

          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <p>
              According to Facebook Platform Rules, Instagram Graph API regulations, and LinkedIn Developer policies, users have the right to request deletion of their data collected by PostCraft.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-base mb-2">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                  Instant Self-Service Disconnect (Recommended)
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Log in to your PostCraft account, go to <strong>Connected Accounts</strong> (`/dashboard/accounts`), and click <strong>&quot;মুছুন&quot; (Remove)</strong> on your Facebook Page, Instagram Account, or LinkedIn Channel. This will immediately and permanently delete stored access tokens and channel IDs from our database.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-base mb-2">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
                  Revoking Access from Meta (Facebook / Instagram)
                </div>
                <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1 mt-2">
                  <li>Go to your Facebook profile <strong>Settings & Privacy &gt; Settings</strong>.</li>
                  <li>In the left sidebar, click on <strong>Apps and Websites</strong>.</li>
                  <li>Search for <strong>PostCraft</strong> in the active applications list.</li>
                  <li>Click <strong>Remove</strong> to permanently sever authorization.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-base mb-2">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">3</span>
                  Revoking Access from LinkedIn
                </div>
                <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1 mt-2">
                  <li>Click your LinkedIn profile icon and navigate to <strong>Settings & Privacy</strong>.</li>
                  <li>Click <strong>Data privacy</strong> from the sidebar menu.</li>
                  <li>Select <strong>Permitted services</strong> under the <em>Other applications</em> section.</li>
                  <li>Find <strong>PostCraft</strong> and click <strong>Remove</strong>.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-base mb-2">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">4</span>
                  Complete Account & Data Wipe Request
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  To request complete deletion of your user profile, email address, password record, and historical post logs from our servers, send an email to:
                </p>
                <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-2 text-xs">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Email: <a href="mailto:privacy@postcraft.com" className="font-semibold text-indigo-600 hover:underline">privacy@postcraft.com</a> (Subject: &quot;Data Deletion Request&quot;)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PostCraft. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-indigo-600">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600">
              Terms of Service
            </Link>
            <Link href="/data-deletion" className="font-semibold text-slate-700 hover:text-indigo-600">
              Data Deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
