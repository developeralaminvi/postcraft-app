import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { handleFacebookOAuthCallback, handleLinkedInOAuthCallback } from '@/lib/oauth';

export async function GET(
  req: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const platform = (params.platform || '').toLowerCase();
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error') || searchParams.get('error_description');

    if (errorParam || !code) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/accounts?error=${encodeURIComponent(
            errorParam || 'Authentication was cancelled or failed'
          )}`,
          req.url
        )
      );
    }

    // 1. Handle Facebook & Instagram OAuth Callback
    if (platform === 'facebook') {
      const result = await handleFacebookOAuthCallback(code);
      if (!result.success) {
        return NextResponse.redirect(
          new URL(
            `/dashboard/accounts?error=${encodeURIComponent(result.error || 'Failed to authenticate with Facebook')}`,
            req.url
          )
        );
      }

      let connectedCount = 0;

      // Save all discovered Facebook Pages
      for (const page of result.pages) {
        await prisma.socialAccount.upsert({
          where: {
            userId_platform_accountId: {
              userId: user.id,
              platform: 'FACEBOOK',
              accountId: page.id,
            },
          },
          update: {
            name: page.name,
            avatar: page.avatar,
            category: page.category,
            accessToken: page.accessToken,
            isActive: true,
          },
          create: {
            userId: user.id,
            platform: 'FACEBOOK',
            accountId: page.id,
            name: page.name,
            avatar: page.avatar,
            category: page.category,
            accessToken: page.accessToken,
            isActive: true,
          },
        });
        connectedCount++;
      }

      // Save all discovered Instagram Accounts
      for (const ig of result.instagramAccounts) {
        await prisma.socialAccount.upsert({
          where: {
            userId_platform_accountId: {
              userId: user.id,
              platform: 'INSTAGRAM',
              accountId: ig.id,
            },
          },
          update: {
            name: ig.name,
            avatar: ig.avatar,
            category: ig.category,
            accessToken: ig.accessToken,
            isActive: true,
          },
          create: {
            userId: user.id,
            platform: 'INSTAGRAM',
            accountId: ig.id,
            name: ig.name,
            avatar: ig.avatar,
            category: ig.category,
            accessToken: ig.accessToken,
            isActive: true,
          },
        });
        connectedCount++;
      }

      return NextResponse.redirect(
        new URL(
          `/dashboard/accounts?success=${encodeURIComponent(
            `Successfully connected ${connectedCount} social channel(s) via Facebook!`
          )}`,
          req.url
        )
      );
    }

    // 2. Handle LinkedIn OAuth Callback
    if (platform === 'linkedin') {
      const result = await handleLinkedInOAuthCallback(code);
      if (!result.success || !result.account) {
        return NextResponse.redirect(
          new URL(
            `/dashboard/accounts?error=${encodeURIComponent(result.error || 'Failed to authenticate with LinkedIn')}`,
            req.url
          )
        );
      }

      const acc = result.account;
      await prisma.socialAccount.upsert({
        where: {
          userId_platform_accountId: {
            userId: user.id,
            platform: 'LINKEDIN',
            accountId: acc.id,
          },
        },
        update: {
          name: acc.name,
          avatar: acc.avatar,
          category: acc.category,
          accessToken: acc.accessToken,
          isActive: true,
        },
        create: {
          userId: user.id,
          platform: 'LINKEDIN',
          accountId: acc.id,
          name: acc.name,
          avatar: acc.avatar,
          category: acc.category,
          accessToken: acc.accessToken,
          isActive: true,
        },
      });

      return NextResponse.redirect(
        new URL(
          `/dashboard/accounts?success=${encodeURIComponent(
            `Successfully connected LinkedIn account: ${acc.name}!`
          )}`,
          req.url
        )
      );
    }

    return NextResponse.redirect(new URL('/dashboard/accounts', req.url));
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}
