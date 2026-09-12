export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Sparkles,
  Calendar,
  MessageSquare,
  Share2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navbar */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">PostCraft</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm transition"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Social Media Automation SaaS
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Schedule Posts & <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Automate First Comments
          </span>{' '}
          Effortlessly.
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Inspired by Postiz. Schedule your Facebook posts with exact timing and automatically drop high-converting links or hashtags in the first comment immediately or on a delay.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-100 transition"
          >
            Create Your Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Facebook Graph Integration
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Connect your Facebook Pages with secure Page Access Tokens and publish posts directly to your audience.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              First Comment Auto-Pilot
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automatically post your call-to-actions, external links, or hashtags as the first comment instantly or with custom delay.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Queue & Scheduler Engine
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Plan weeks in advance. Our automated background queue handles scheduled delivery with precision.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-700">PostCraft</span>
            <span>• © {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-indigo-600 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600 transition">
              Terms of Service
            </Link>
            <Link href="/data-deletion" className="hover:text-indigo-600 transition">
              User Data Deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}