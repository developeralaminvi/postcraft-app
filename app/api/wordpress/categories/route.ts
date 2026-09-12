import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getWordPressCategories } from '@/lib/wordpress';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.platform !== 'WORDPRESS') {
      return NextResponse.json(
        { error: 'Specified account is not a WordPress site' },
        { status: 400 }
      );
    }

    const categories = await getWordPressCategories(
      account.accountId,
      account.accessToken
    );

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching WordPress categories:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
