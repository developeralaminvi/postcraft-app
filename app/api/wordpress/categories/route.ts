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

    let account = null;
    if (accountId) {
      account = await prisma.socialAccount.findFirst({
        where: {
          userId: user.id,
          platform: 'WORDPRESS',
          OR: [
            { id: accountId },
            { accountId: accountId },
          ],
        },
      });
    } else {
      account = await prisma.socialAccount.findFirst({
        where: {
          userId: user.id,
          platform: 'WORDPRESS',
        },
      });
    }

    if (!account) {
      return NextResponse.json(
        { error: 'No connected WordPress account found.' },
        { status: 404 }
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
