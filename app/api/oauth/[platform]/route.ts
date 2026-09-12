import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFacebookAuthUrl, getLinkedInAuthUrl, getOAuthConfig } from '@/lib/oauth';

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
    const config = getOAuthConfig();

    if (platform === 'facebook') {
      if (!config.facebook.appId || !config.facebook.appSecret) {
        // Not yet configured in .env -> redirect to accounts with fast-connect prompt
        return NextResponse.redirect(
          new URL('/dashboard/accounts?fastConnect=FACEBOOK&reason=unconfigured', req.url)
        );
      }
      const authUrl = getFacebookAuthUrl(user.id, false);
      return NextResponse.redirect(authUrl);
    }

    if (platform === 'instagram') {
      if (!config.facebook.appId || !config.facebook.appSecret) {
        return NextResponse.redirect(
          new URL('/dashboard/accounts?fastConnect=INSTAGRAM&reason=unconfigured', req.url)
        );
      }
      const authUrl = getFacebookAuthUrl(user.id, true);
      return NextResponse.redirect(authUrl);
    }

    if (platform === 'linkedin') {
      if (!config.linkedin.clientId || !config.linkedin.clientSecret) {
        return NextResponse.redirect(
          new URL('/dashboard/accounts?fastConnect=LINKEDIN&reason=unconfigured', req.url)
        );
      }
      const authUrl = getLinkedInAuthUrl(user.id);
      return NextResponse.redirect(authUrl);
    }

    return NextResponse.redirect(new URL('/dashboard/accounts', req.url));
  } catch (err: any) {
    console.error('OAuth redirect error:', err);
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}
