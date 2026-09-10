import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { publishFacebookPost, publishFacebookComment } from '@/lib/facebook';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const post = await prisma.post.findFirst({
      where: { id, userId: user.id },
      include: {
        account: true,
        comments: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const publishRes = await publishFacebookPost({
      pageId: post.account.accountId,
      accessToken: post.account.accessToken,
      message: post.content,
      mediaUrl: post.mediaUrl,
    });

    if (!publishRes.success || !publishRes.postId) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          errorMessage: publishRes.error || 'Failed to publish to Facebook',
        },
      });

      return NextResponse.json(
        { error: publishRes.error || 'Failed to publish' },
        { status: 400 }
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'PUBLISHED',
        platformPostId: publishRes.postId,
        platformPostUrl: publishRes.postUrl,
        publishedAt: new Date(),
        errorMessage: null,
      },
    });

    // Process attached comments
    for (const comment of post.comments) {
      if (comment.delayMinutes === 0) {
        const commentRes = await publishFacebookComment({
          postId: publishRes.postId,
          accessToken: post.account.accessToken,
          message: comment.content,
        });

        await prisma.comment.update({
          where: { id: comment.id },
          data: {
            status: commentRes.success ? 'PUBLISHED' : 'FAILED',
            platformCommentId: commentRes.commentId || null,
            publishedAt: commentRes.success ? new Date() : null,
            errorMessage: commentRes.error || null,
          },
        });
      } else {
        const scheduledTime = new Date(Date.now() + comment.delayMinutes * 60 * 1000);
        await prisma.comment.update({
          where: { id: comment.id },
          data: {
            status: 'PENDING',
            scheduledAt: scheduledTime,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Post published successfully!',
    });
  } catch (error: any) {
    console.error('Error publishing post:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to publish post' },
      { status: 500 }
    );
  }
}
