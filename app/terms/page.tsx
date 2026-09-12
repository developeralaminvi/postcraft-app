'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Scale
} from 'lucide-react';

export default function TermsPage() {
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
                  <span>Copy Terms URL</span>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <Scale className="w-3.5 h-3.5" /> Legal Terms
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Last updated: September 2026
            </p>
          </div>

          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
              <p>
                By registering for or using PostCraft (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Authorized Use of Social Accounts</h2>
              <p>
                You represent and warrant that you own or have explicit administrative authorization to manage the social media accounts, Facebook Pages, Instagram Business profiles, and LinkedIn pages you connect to PostCraft. You agree to comply with all terms and policies of Meta Platforms, Inc. and LinkedIn Corporation.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Prohibited Activities</h2>
              <p>You agree not to use PostCraft to:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                <li>Send spam, unsolicited commercial advertisements, or fraudulent schemes.</li>
                <li>Publish content that infringes upon copyright, trademarks, or intellectual property rights.</li>
                <li>Distribute malicious code, malware, or automate disruptive rate-limit flooding.</li>
                <li>Violate any community standards established by Facebook, Instagram, or LinkedIn.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Disclaimers and Limitations of Liability</h2>
              <p>
                The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We are not liable for any API downtime, algorithm changes, or account restrictions enforced independently by Facebook, Instagram, or LinkedIn.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that engage in abuse or violate these terms. You may terminate your account at any time by disconnecting your channels and deleting your account.
              </p>
            </section>
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
            <Link href="/terms" className="font-semibold text-slate-700 hover:text-indigo-600">
              Terms of Service
            </Link>
            <Link href="/data-deletion" className="hover:text-indigo-600">
              Data Deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
