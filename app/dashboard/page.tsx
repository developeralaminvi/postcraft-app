import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  PenSquare,
  Share2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [accountsCount, totalPosts, scheduledPosts, publishedPosts, recentPosts] =
    await Promise.all([
      prisma.socialAccount.count({ where: { userId: user.id } }),
      prisma.post.count({ where: { userId: user.id } }),
      prisma.post.count({ where: { userId: user.id, status: 'SCHEDULED' } }),
      prisma.post.count({ where: { userId: user.id, status: 'PUBLISHED' } }),
      prisma.post.findMany({
        where: { userId: user.id },
        include: {
          account: true,
          comments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-950/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200 bg-white/10 px-3 py-1 rounded-full">
            Social Pilot Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">
            Welcome back, {user.name || 'Creator'}!
          </h1>
          <p className="text-sm text-indigo-100/80 mt-1 max-w-xl">
            You have {scheduledPosts} posts scheduled for delivery. Control your social presence and auto-comment automations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/create-post"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 shadow-md transition"
          >
            <PenSquare className="w-4 h-4" /> Create Post
          </Link>
          <Link
            href="/dashboard/accounts"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-800/80 text-white font-medium text-sm hover:bg-indigo-800 border border-indigo-600/50 transition"
          >
            <Share2 className="w-4 h-4" /> Accounts
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Connected Pages
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{accountsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Facebook Pages active</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Scheduled Posts
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{scheduledPosts}</p>
          <p className="text-xs text-slate-400 mt-1">In queue for delivery</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Published Posts
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{publishedPosts}</p>
          <p className="text-xs text-slate-400 mt-1">Delivered to audience</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Created
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{totalPosts}</p>
          <p className="text-xs text-slate-400 mt-1">Lifetime posts created</p>
        </div>
      </div>

      {/* Main Grid: Recent Posts & Quick Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Posts (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Posts & Activities</h2>
              <p className="text-xs text-slate-500">Track delivery status & auto-comment responses</p>
            </div>
            <Link
              href="/dashboard/posts"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
              <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <PenSquare className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">No posts created yet</p>
              <p className="text-xs text-slate-400 mt-1">Connect your Facebook page and schedule your first post!</p>
              <Link
                href="/dashboard/create-post"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Create First Post
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPosts.map((post) => {
                const isPublished = post.status === 'PUBLISHED';
                const isScheduled = post.status === 'SCHEDULED';
                const isFailed = post.status === 'FAILED';

                return (
                  <div key={post.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-800">
                          {post.account.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isScheduled
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isFailed
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {post.status}
                        </span>

                        {post.comments.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                            <MessageSquare className="w-3 h-3" /> Auto-Comment ({post.comments[0].status})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>

                      {post.scheduledAt && isScheduled && (
                        <p className="text-[11px] text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Scheduled for:{' '}
                          {new Date(post.scheduledAt).toLocaleString()}
                        </p>
                      )}

                      {post.publishedAt && isPublished && (
                        <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Published at:{' '}
                          {new Date(post.publishedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {post.platformPostUrl && (
                      <a
                        href={post.platformPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="View on Facebook"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Help & Next Steps (1 col) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" /> Connecting Facebook
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              To publish live to Facebook Pages, you need a <strong>Page Access Token</strong> and <strong>Page ID</strong> from the Meta for Developers Graph API Explorer.
            </p>
            <Link
              href="/dashboard/accounts"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white px-3.5 py-2 rounded-lg transition"
            >
              Configure Accounts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" /> First Comment Secret
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Placing external URLs and promotional hashtags in the first comment rather than the main post caption significantly improves Facebook organic post reach!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}