import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { publishFacebookPost, publishFacebookComment } from '@/lib/facebook';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            platform: true,
            avatar: true,
            accountId: true,
          },
        },
        comments: true,
        milestones: true,
        autoReply: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
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
      accountId,
      content,
      mediaUrl,
      mediaType = 'TEXT',
      publishNow = false,
      scheduledAt,
      autoComment,
      milestoneTriggers = [],
      autoReply,
    } = body;

    if (!accountId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Account and content are required' },
        { status: 400 }
      );
    }

    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: 'Selected account not found' }, { status: 404 });
    }

    let publishedPostId: string | null = null;
    let publishedPostUrl: string | null = null;
    let postStatus = 'SCHEDULED';
    let errorMessage: string | null = null;
    let publishedDate: Date | null = null;

    if (publishNow) {
      const publishRes = await publishFacebookPost({
        pageId: account.accountId,
        accessToken: account.accessToken,
        message: content.trim(),
        mediaUrl: mediaUrl?.trim() || null,
        mediaType: mediaType,
      });

      if (!publishRes.success || !publishRes.postId) {
        postStatus = 'FAILED';
        errorMessage = publishRes.error || 'Failed to publish to Facebook';
      } else {
        postStatus = 'PUBLISHED';
        publishedPostId = publishRes.postId;
        publishedPostUrl = publishRes.postUrl || null;
        publishedDate = new Date();
      }
    }

    // Create the post in the database
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        accountId: account.id,
        content: content.trim(),
        mediaUrl: mediaUrl?.trim() || null,
        mediaType: mediaType,
        status: postStatus,
        scheduledAt: !publishNow && scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: publishedDate,
        platformPostId: publishedPostId,
        platformPostUrl: publishedPostUrl,
        errorMessage: errorMessage,
      },
    });

    if (postStatus === 'FAILED') {
      return NextResponse.json(
        { error: errorMessage || 'Failed to publish post', post },
        { status: 400 }
      );
    }

    // 1. Handle Auto First Comment
    if (autoComment?.enabled && autoComment.content?.trim()) {
      const delay = Number(autoComment.delayMinutes) || 0;

      if (publishNow && publishedPostId) {
        if (delay === 0) {
          const commentRes = await publishFacebookComment({
            postId: publishedPostId,
            accessToken: account.accessToken,
            message: autoComment.content.trim(),
          });

          await prisma.comment.create({
            data: {
              postId: post.id,
              content: autoComment.content.trim(),
              delayMinutes: 0,
              status: commentRes.success ? 'PUBLISHED' : 'FAILED',
              platformCommentId: commentRes.commentId || null,
              publishedAt: commentRes.success ? new Date() : null,
              errorMessage: commentRes.error || null,
            },
          });
        } else {
          await prisma.comment.create({
            data: {
              postId: post.id,
              content: autoComment.content.trim(),
              delayMinutes: delay,
              status: 'PENDING',
              scheduledAt: new Date(Date.now() + delay * 60 * 1000),
            },
          });
        }
      } else {
        await prisma.comment.create({
          data: {
            postId: post.id,
            content: autoComment.content.trim(),
            delayMinutes: delay,
            status: 'PENDING',
          },
        });
      }
    }

    // 2. Handle Milestone Triggers (e.g. 10 Likes, 20 Comments)
    if (Array.isArray(milestoneTriggers) && milestoneTriggers.length > 0) {
      for (const mt of milestoneTriggers) {
        if (mt.commentText?.trim() && Number(mt.threshold) > 0) {
          await prisma.milestoneTrigger.create({
            data: {
              postId: post.id,
              type: mt.type === 'COMMENTS' ? 'COMMENTS' : 'LIKES',
              threshold: Number(mt.threshold),
              commentText: mt.commentText.trim(),
            },
          });
        }
      }
    }

    // 3. Handle Auto-Reply to user comments
    if (autoReply?.isEnabled && autoReply.replyText?.trim()) {
      await prisma.autoReplyRule.create({
        data: {
          postId: post.id,
          isEnabled: true,
          replyText: autoReply.replyText.trim(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      post,
      message: publishNow ? 'Post published successfully!' : 'Post scheduled successfully!',
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}