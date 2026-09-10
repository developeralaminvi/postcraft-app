import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { verifyFacebookPage } from '@/lib/facebook';

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

    const { platform = 'FACEBOOK', pageId, accessToken } = await req.json();

    if (!pageId || !accessToken) {
      return NextResponse.json(
        { error: 'Page ID and Page Access Token are required' },
        { status: 400 }
      );
    }

    // Verify token with Meta Graph API
    const verification = await verifyFacebookPage(pageId.trim(), accessToken.trim());
    if (!verification.success || !verification.data) {
      return NextResponse.json(
        { error: verification.error || 'Invalid Facebook Page credentials' },
        { status: 400 }
      );
    }

    const pageData = verification.data;

    // Upsert the social account in database
    const account = await prisma.socialAccount.upsert({
      where: {
        userId_platform_accountId: {
          userId: user.id,
          platform,
          accountId: pageData.id,
        },
      },
      update: {
        name: pageData.name,
        avatar: pageData.avatar,
        category: pageData.category,
        accessToken: pageData.pageAccessToken,
        isActive: true,
      },
      create: {
        userId: user.id,
        platform,
        accountId: pageData.id,
        name: pageData.name,
        avatar: pageData.avatar,
        category: pageData.category,
        accessToken: pageData.pageAccessToken,
        isActive: true,
      },
    });

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
      message: `Successfully connected Facebook Page: ${account.name}`,
    });
  } catch (error: any) {
    console.error('Error connecting account:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to connect account' },
      { status: 500 }
    );
  }
}
