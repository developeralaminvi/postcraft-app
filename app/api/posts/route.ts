import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { publishFacebookPost, publishFacebookComment } from '@/lib/facebook';
import { publishInstagramPost, publishInstagramComment } from '@/lib/instagram';
import { publishLinkedInPost, publishLinkedInComment } from '@/lib/linkedin';

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
      accountIds,
      content = '',
      mediaUrl,
      mediaType = 'TEXT',
      publishNow = false,
      scheduledAt,
      autoComment,
      milestoneTriggers = [],
      autoReply,
      customizations = {},
    } = body;

    // Resolve target account IDs (support single accountId or array of accountIds)
    const targetIds: string[] = Array.isArray(accountIds) && accountIds.length > 0
      ? accountIds
      : accountId ? [accountId] : [];

    if (targetIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one publishing account must be selected' },
        { status: 400 }
      );
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { id: { in: targetIds }, userId: user.id },
    });

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No valid social accounts found' },
        { status: 404 }
      );
    }

    const createdPosts = [];
    const errors = [];

    // Loop through each target account and create/publish its post
    for (const account of accounts) {
      try {
        const custom = customizations[account.id];
        const isCustom = !!custom?.isCustomized;

        const effectiveContent = (isCustom && custom?.content?.trim())
          ? custom.content.trim()
          : content.trim();

        const effectiveMediaUrl = (isCustom && custom?.mediaUrl !== undefined)
          ? (custom.mediaUrl?.trim() || null)
          : (mediaUrl?.trim() || null);

        const effectiveMediaType = (isCustom && custom?.mediaType)
          ? custom.mediaType
          : (mediaType || 'TEXT');

        const effectiveAutoComment = (isCustom && custom?.autoComment !== undefined)
          ? custom.autoComment
          : autoComment;

        // Validation for Instagram
        if (account.platform === 'INSTAGRAM' && !effectiveMediaUrl) {
          errors.push(`${account.name} (Instagram) requires an image or video attachment.`);
          continue;
        }

        if (!effectiveContent) {
          errors.push(`Content for ${account.name} cannot be empty.`);
          continue;
        }

        let publishedPostId: string | null = null;
        let publishedPostUrl: string | null = null;
        let postStatus = 'SCHEDULED';
        let errorMessage: string | null = null;
        let publishedDate: Date | null = null;

        if (publishNow) {
          let publishRes;
          if (account.platform === 'LINKEDIN') {
            publishRes = await publishLinkedInPost({
              authorUrn: account.accountId,
              accessToken: account.accessToken,
              commentary: effectiveContent,
              mediaUrl: effectiveMediaUrl,
              mediaType: effectiveMediaType as any,
            });
          } else if (account.platform === 'INSTAGRAM') {
            publishRes = await publishInstagramPost({
              igUserId: account.accountId,
              accessToken: account.accessToken,
              caption: effectiveContent,
              mediaUrl: effectiveMediaUrl || '',
              mediaType: (effectiveMediaType as any) || 'IMAGE',
            });
          } else {
            publishRes = await publishFacebookPost({
              pageId: account.accountId,
              accessToken: account.accessToken,
              message: effectiveContent,
              mediaUrl: effectiveMediaUrl,
              mediaType: effectiveMediaType as any,
            });
          }

          if (!publishRes.success || !publishRes.postId) {
            postStatus = 'FAILED';
            errorMessage = publishRes.error || `Failed to publish to ${account.platform}`;
            errors.push(`Failed to publish to ${account.name}: ${errorMessage}`);
          } else {
            postStatus = 'PUBLISHED';
            publishedPostId = publishRes.postId;
            publishedPostUrl = publishRes.postUrl || null;
            publishedDate = new Date();
          }
        }

        // Create the post in DB
        const post = await prisma.post.create({
          data: {
            userId: user.id,
            accountId: account.id,
            content: effectiveContent,
            mediaUrl: effectiveMediaUrl,
            mediaType: effectiveMediaType,
            status: postStatus,
            scheduledAt: !publishNow && scheduledAt ? new Date(scheduledAt) : null,
            publishedAt: publishedDate,
            platformPostId: publishedPostId,
            platformPostUrl: publishedPostUrl,
            errorMessage: errorMessage,
          },
        });

        // Handle Auto First Comment
        if (effectiveAutoComment?.enabled && effectiveAutoComment.content?.trim()) {
          const delay = Number(effectiveAutoComment.delayMinutes) || 0;

          if (publishNow && publishedPostId) {
            if (delay === 0) {
              let commentRes;
              if (account.platform === 'LINKEDIN') {
                commentRes = await publishLinkedInComment({
                  postUrn: publishedPostId,
                  accessToken: account.accessToken,
                  message: effectiveAutoComment.content.trim(),
                });
              } else if (account.platform === 'INSTAGRAM') {
                commentRes = await publishInstagramComment({
                  mediaId: publishedPostId,
                  accessToken: account.accessToken,
                  message: effectiveAutoComment.content.trim(),
                });
              } else {
                commentRes = await publishFacebookComment({
                  postId: publishedPostId,
                  accessToken: account.accessToken,
                  message: effectiveAutoComment.content.trim(),
                });
              }

              await prisma.comment.create({
                data: {
                  postId: post.id,
                  content: effectiveAutoComment.content.trim(),
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
                  content: effectiveAutoComment.content.trim(),
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
                content: effectiveAutoComment.content.trim(),
                delayMinutes: delay,
                status: 'PENDING',
              },
            });
          }
        }

        // Handle Milestone Triggers
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

        // Handle Auto-Reply to user comments
        if (autoReply?.isEnabled && autoReply.replyText?.trim()) {
          await prisma.autoReplyRule.create({
            data: {
              postId: post.id,
              isEnabled: true,
              replyText: autoReply.replyText.trim(),
            },
          });
        }

        createdPosts.push(post);
      } catch (err: any) {
        console.error(`Error processing post for ${account.name}:`, err);
        errors.push(`Error on ${account.name}: ${err?.message || 'Internal error'}`);
      }
    }

    if (createdPosts.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(' | ') },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: createdPosts.length,
      posts: createdPosts,
      post: createdPosts[0], // backward compatibility
      errors: errors.length > 0 ? errors : undefined,
      message: publishNow
        ? `Successfully published to ${createdPosts.length} account${createdPosts.length > 1 ? 's' : ''}!`
        : `Successfully scheduled for ${createdPosts.length} account${createdPosts.length > 1 ? 's' : ''}!`,
    });
  } catch (error: any) {
    console.error('Error creating post(s):', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create post(s)' },
      { status: 500 }
    );
  }
}