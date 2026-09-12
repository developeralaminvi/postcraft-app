'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Lock,
  Share2,
  Trash2,
  Mail,
  ExternalLink,
  Info
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [copied, setCopied] = useState(false);

  const copyPageUrl = () => {
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
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">PostCraft</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={copyPageUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer"
              title="Copy URL for Facebook/LinkedIn Developer App"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">লিঙ্ক কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Privacy URL</span>
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

      {/* Developer Notice Card */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-900">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-950">
                LinkedIn ও Facebook Developer App তৈরির জন্য এই লিংকটি ব্যবহার করুন
              </p>
              <p className="text-indigo-800/80 mt-0.5">
                Developer পোর্টালে <strong>Privacy policy URL</strong> ঘরে এই পেজের লিঙ্কটি পেস্ট করুন।
              </p>
            </div>
          </div>
          <button
            onClick={copyPageUrl}
            className="shrink-0 px-3 py-1.5 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition cursor-pointer"
          >
            {copied ? 'Copied!' : 'কপি করুন'}
          </button>
        </div>
      </div>

      {/* Content Container */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <article className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 shadow-xs">
          {/* Title header */}
          <div className="border-b border-slate-100 pb-8 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <Shield className="w-3.5 h-3.5" /> Privacy & Data Protection
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Effective Date: January 1, 2026 • Last updated: September 2026
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-600">
            {/* 1. Introduction */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                1. Introduction
              </h2>
              <p>
                Welcome to <strong>PostCraft</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We operate the PostCraft social media scheduling and automation platform. We are committed to protecting your privacy and ensuring the security of your personal data when you use our web application, APIs, and services.
              </p>
              <p className="mt-2">
                This Privacy Policy explains what information we collect from you, how it is handled, and your rights concerning your personal information, specifically regarding integrations with third-party social networks such as <strong>Meta Platforms, Inc. (Facebook & Instagram)</strong> and <strong>LinkedIn Corporation</strong>.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                2. Information We Collect
              </h2>
              <p>We only collect information necessary to provide and improve PostCraft services:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-indigo-600" /> Account & Authentication Data
                  </h3>
                  <p className="text-xs text-slate-600">
                    Your name, email address, password hash, and profile settings collected during sign-up to manage your PostCraft account.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-blue-600" /> Connected Social Account Data
                  </h3>
                  <p className="text-xs text-slate-600">
                    Social platform IDs (Facebook Page ID, Instagram Business Account ID, LinkedIn Member URN/Organization ID), display names, avatar URLs, and OAuth access tokens provided to allow publishing on your behalf.
                  </p>
                </div>
              </div>
              <p className="mt-4">
                <strong>Content & Post Data:</strong> Text, images, scheduled publication dates, mentions, and automated first-comment configurations you draft or schedule in PostCraft.
              </p>
            </section>

            {/* 3. How We Use Your Data */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Publishing Scheduled Content:</strong> To broadcast and publish your scheduled posts, photos, and captions to your designated Facebook Pages, Instagram accounts, and LinkedIn channels.</li>
                <li><strong>First-Comment Automation:</strong> To submit automated first comments containing links, hashtags, or mentions as configured by you.</li>
                <li><strong>Account Analytics & History:</strong> To display post delivery status (published, pending, failed) in your user dashboard.</li>
                <li><strong>System Security:</strong> To detect and prevent unauthorized access, abuse, and technical failures.</li>
              </ul>
              <div className="mt-3 p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                <strong>Note:</strong> We do NOT sell, rent, or monetize your personal data or social media tokens to third parties or advertising brokers under any circumstances.
              </div>
            </section>

            {/* 4. Third-Party Social Media APIs */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Third-Party Social Network Integrations
              </h2>
              <p>
                PostCraft connects with official public APIs provided by social networks:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Meta Platforms (Facebook & Instagram Graph APIs):</strong> We adhere to Meta Platform Terms and Developer Policies. You can review Meta&apos;s Data Policy at{' '}
                  <a
                    href="https://www.facebook.com/privacy/policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    facebook.com/privacy/policy <ExternalLink className="w-3 h-3" />
                  </a>.
                </li>
                <li>
                  <strong>LinkedIn Corporation (LinkedIn Consumer & Marketing APIs):</strong> We adhere to the LinkedIn API Terms of Use. You can review LinkedIn&apos;s Privacy Policy at{' '}
                  <a
                    href="https://www.linkedin.com/legal/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    linkedin.com/legal/privacy-policy <ExternalLink className="w-3 h-3" />
                  </a>.
                </li>
              </ul>
            </section>

            {/* 5. Data Deletion Instructions (Mandatory for Meta & LinkedIn Review) */}
            <section id="data-deletion" className="scroll-mt-24 p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                5. User Data Deletion Instructions (Facebook & LinkedIn)
              </h2>
              <p className="text-xs text-slate-600 mb-4">
                In compliance with Facebook Platform and LinkedIn Platform Rules, you have full control to request the deletion of your account and any associated social media data at any time.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900">Option 1: Disconnect via PostCraft Dashboard</h4>
                  <p className="text-slate-600 mt-1">
                    Log in to PostCraft, navigate to <strong>Connected Accounts</strong> (`/dashboard/accounts`), and click the <strong>&quot;মুছুন&quot; (Remove)</strong> button next to any connected Facebook, Instagram, or LinkedIn account. This instantly deletes the access token and stored platform data from our database.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900">Option 2: Revoke Access from Facebook</h4>
                  <p className="text-slate-600 mt-1">
                    1. Go to your Facebook profile <strong>Settings & Privacy &gt; Settings</strong>.<br />
                    2. Click on <strong>Apps and Websites</strong> on the left panel.<br />
                    3. Find <strong>PostCraft</strong> and click <strong>Remove</strong>.<br />
                    4. Check the box to delete posts, videos, or events and confirm removal.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900">Option 3: Revoke Access from LinkedIn</h4>
                  <p className="text-slate-600 mt-1">
                    1. Click on your profile icon in LinkedIn and select <strong>Settings & Privacy</strong>.<br />
                    2. Go to <strong>Data privacy</strong> on the left menu.<br />
                    3. Under <em>&quot;Other applications&quot;</em>, click <strong>Permitted services</strong>.<br />
                    4. Locate <strong>PostCraft</strong> and click <strong>Remove</strong>.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900">Option 4: Request Full Data Deletion by Email</h4>
                  <p className="text-slate-600 mt-1">
                    If you want your entire PostCraft account, post logs, and all stored data permanently wiped from our servers, send an email to{' '}
                    <a href="mailto:privacy@postcraft.com" className="font-medium text-indigo-600 hover:underline">
                      privacy@postcraft.com
                    </a>{' '}
                    with the subject line &quot;Delete My Data&quot;. We will process and verify your request within 48 business hours.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Data Storage & Security */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. Data Retention and Security
              </h2>
              <p>
                We implement industry-standard encryption protocols (HTTPS / TLS and encrypted database fields) to safeguard your access credentials and sensitive tokens. Your social tokens are stored strictly for scheduling posts that you have authorized and are permanently deleted when you disconnect your account.
              </p>
            </section>

            {/* 7. Contact Information */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" /> 7. Contact Us
              </h2>
              <p>
                If you have any questions, feedback, or concerns regarding this Privacy Policy or our compliance with Meta/LinkedIn Developer policies, please reach out to us:
              </p>
              <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <p><strong>PostCraft Privacy Team</strong></p>
                <p>Email: <a href="mailto:privacy@postcraft.com" className="text-indigo-600 hover:underline">privacy@postcraft.com</a></p>
                <p>Website: <a href="https://postcraft.com" className="text-indigo-600 hover:underline">https://postcraft.com</a></p>
              </div>
            </section>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PostCraft. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="font-semibold text-slate-700 hover:text-indigo-600">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600">
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
