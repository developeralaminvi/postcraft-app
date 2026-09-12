import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { publishFacebookPost, publishFacebookComment } from '@/lib/facebook';
import { publishInstagramPost, publishInstagramComment } from '@/lib/instagram';
import { publishLinkedInPost, publishLinkedInComment } from '@/lib/linkedin';
import { publishWordPressPost, publishWordPressComment } from '@/lib/wordpress';

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

    const platform = post.account.platform;
    let publishRes;

    if (platform === 'WORDPRESS') {
      let parsedCategories;
      try {
        if (post.categories) {
          parsedCategories = JSON.parse(post.categories);
        }
      } catch {
        parsedCategories = post.categories ? post.categories.split(',').map((c) => c.trim()) : undefined;
      }

      let parsedTags;
      try {
        if (post.tags) {
          parsedTags = JSON.parse(post.tags);
        }
      } catch {
        parsedTags = post.tags ? post.tags.split(',').map((t) => t.trim()) : undefined;
      }

      publishRes = await publishWordPressPost({
        siteUrl: post.account.accountId,
        credentials: post.account.accessToken,
        title: post.title || 'Untitled Post',
        content: post.content,
        status: 'publish',
        categories: parsedCategories,
        tags: parsedTags,
        mediaUrl: post.mediaUrl,
        excerpt: post.excerpt,
      });
    } else if (platform === 'LINKEDIN') {
      publishRes = await publishLinkedInPost({
        authorUrn: post.account.accountId,
        accessToken: post.account.accessToken,
        commentary: post.content,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType as any,
      });
    } else if (platform === 'INSTAGRAM') {
      publishRes = await publishInstagramPost({
        igUserId: post.account.accountId,
        accessToken: post.account.accessToken,
        caption: post.content,
        mediaUrl: post.mediaUrl || '',
        mediaType: (post.mediaType as any) || 'IMAGE',
      });
    } else {
      publishRes = await publishFacebookPost({
        pageId: post.account.accountId,
        accessToken: post.account.accessToken,
        message: post.content,
        mediaUrl: post.mediaUrl,
        mediaType: (post.mediaType as any) || 'TEXT',
      });
    }

    if (!publishRes.success || !publishRes.postId) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          errorMessage: publishRes.error || `Failed to publish to ${post.account.platform}`,
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
        let commentRes;
        if (platform === 'WORDPRESS') {
          commentRes = await publishWordPressComment({
            siteUrl: post.account.accountId,
            credentials: post.account.accessToken,
            postId: publishRes.postId,
            content: comment.content,
          });
        } else if (platform === 'LINKEDIN') {
          commentRes = await publishLinkedInComment({
            postUrn: publishRes.postId,
            accessToken: post.account.accessToken,
            message: comment.content,
          });
        } else if (platform === 'INSTAGRAM') {
          commentRes = await publishInstagramComment({
            mediaId: publishRes.postId,
            accessToken: post.account.accessToken,
            message: comment.content,
          });
        } else {
          commentRes = await publishFacebookComment({
            postId: publishRes.postId,
            accessToken: post.account.accessToken,
            message: comment.content,
          });
        }

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
