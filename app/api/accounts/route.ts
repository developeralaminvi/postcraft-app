import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { verifyFacebookPage, verifyFacebookAccount } from '@/lib/facebook';
import { verifyInstagramAccount } from '@/lib/instagram';
import { verifyLinkedInAccount } from '@/lib/linkedin';
import { verifyWordPressAccount } from '@/lib/wordpress';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        platform: true,
        accountId: true,
        name: true,
        avatar: true,
        category: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      platform = 'FACEBOOK',
      pageId,
      accessToken,
      accountType = 'PAGE',
      username: reqUsername,
      appPassword: reqAppPassword,
    } = body;

    if (!pageId || !accessToken) {
      return NextResponse.json(
        { error: 'Account ID and Access Token are required' },
        { status: 400 }
      );
    }

    let accountData: {
      id: string;
      name: string;
      avatar?: string | null;
      category?: string | null;
      token: string;
    };

    if (platform === 'LINKEDIN') {
      const verification = await verifyLinkedInAccount(pageId.trim(), accessToken.trim());
      if (!verification.success || !verification.data) {
        return NextResponse.json(
          { error: verification.error || 'Invalid LinkedIn credentials' },
          { status: 400 }
        );
      }
      const isProfile = accountType === 'PROFILE' || !verification.data.isOrganization;
      accountData = {
        id: verification.data.id,
        name: verification.data.name,
        avatar: verification.data.avatar,
        category: isProfile ? 'LinkedIn Personal Profile' : 'LinkedIn Company Page',
        token: verification.data.accessToken,
      };
    } else if (platform === 'INSTAGRAM') {
      const verification = await verifyInstagramAccount(pageId.trim(), accessToken.trim());
      if (!verification.success || !verification.data) {
        return NextResponse.json(
          { error: verification.error || 'Invalid Instagram credentials' },
          { status: 400 }
        );
      }
      const isProfile = accountType === 'PROFILE';
      accountData = {
        id: verification.data.id,
        name: `@${verification.data.username.replace(/^@/, '')}`,
        avatar: verification.data.avatar,
        category: isProfile ? 'Instagram Creator Profile' : 'Instagram Business',
        token: verification.data.accessToken,
      };
    } else if (platform === 'WORDPRESS') {
      const siteUrl = pageId.trim();
      let username = reqUsername || '';
      let appPassword = reqAppPassword || '';
      if (!username && accessToken.includes(':::')) {
        const parts = accessToken.split(':::');
        username = parts[0];
        appPassword = parts.slice(1).join(':::');
      } else if (!username) {
        username = 'admin';
        appPassword = accessToken;
      }

      const verification = await verifyWordPressAccount(siteUrl, username, appPassword);
      if (!verification.success || !verification.data) {
        return NextResponse.json(
          { error: verification.error || 'Invalid WordPress credentials or unreachable site URL.' },
          { status: 400 }
        );
      }

      accountData = {
        id: verification.data.id,
        name: verification.data.name,
        avatar: verification.data.avatar,
        category: 'WordPress Site / Blog',
        token: verification.data.accessToken,
      };
    } else {
      // Facebook: Page or Personal Profile
      const verification = await verifyFacebookAccount(
        pageId.trim(),
        accessToken.trim(),
        accountType as 'PAGE' | 'PROFILE'
      );
      if (!verification.success || !verification.data) {
        return NextResponse.json(
          { error: verification.error || 'Invalid Facebook credentials' },
          { status: 400 }
        );
      }
      accountData = {
        id: verification.data.id,
        name: verification.data.name,
        avatar: verification.data.avatar,
        category: verification.data.category || (accountType === 'PROFILE' ? 'Facebook Personal Profile' : 'Facebook Page'),
        token: verification.data.accessToken,
      };
    }

    // Upsert the social account in database
    const account = await prisma.socialAccount.upsert({
      where: {
        userId_platform_accountId: {
          userId: user.id,
          platform,
          accountId: accountData.id,
        },
      },
      update: {
        name: accountData.name,
        avatar: accountData.avatar,
        category: accountData.category,
        accessToken: accountData.token,
        isActive: true,
      },
      create: {
        userId: user.id,
        platform,
        accountId: accountData.id,
        name: accountData.name,
        avatar: accountData.avatar,
        category: accountData.category,
        accessToken: accountData.token,
        isActive: true,
      },
    });

    const typeLabel = accountData.category?.includes('Profile') ? 'Personal Profile' : 'Page';
    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        platform: account.platform,
        accountId: account.accountId,
        name: account.name,
        avatar: account.avatar,
        category: account.category,
      },
      message: `Successfully connected ${platform} ${typeLabel}: ${account.name}`,
    });
  } catch (error: any) {
    console.error('Error connecting account:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to connect account' },
      { status: 500 }
    );
  }
}
