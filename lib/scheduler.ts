import { prisma } from './prisma';
import {
  publishFacebookPost,
  publishFacebookComment,
  getPostEngagement,
  getPostRecentComments,
  replyToComment,
} from './facebook';
import {
  publishInstagramPost,
  publishInstagramComment,
  getInstagramEngagement,
  getInstagramRecentComments,
  replyToInstagramComment,
} from './instagram';
import {
  publishLinkedInPost,
  publishLinkedInComment,
  getLinkedInEngagement,
  getLinkedInRecentComments,
  replyToLinkedInComment,
} from './linkedin';

/**
 * Process all scheduled posts that are due for publishing
 */
export async function processDuePosts() {
  const now = new Date();

  const duePosts = await prisma.post.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: {
        lte: now,
      },
    },
    include: {
      account: true,
      comments: true,
    },
    take: 10,
  });

  const results = [];

  for (const post of duePosts) {
    try {
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'PUBLISHING' },
      });

      const platform = post.account.platform;

      let publishResult;
      if (platform === 'LINKEDIN') {
        publishResult = await publishLinkedInPost({
          authorUrn: post.account.accountId,
          accessToken: post.account.accessToken,
          commentary: post.content,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType as any,
        });
      } else if (platform === 'INSTAGRAM') {
        publishResult = await publishInstagramPost({
          igUserId: post.account.accountId,
          accessToken: post.account.accessToken,
          caption: post.content,
          mediaUrl: post.mediaUrl || '',
          mediaType: (post.mediaType as any) || 'IMAGE',
        });
      } else {
        publishResult = await publishFacebookPost({
          pageId: post.account.accountId,
          accessToken: post.account.accessToken,
          message: post.content,
          mediaUrl: post.mediaUrl,
          mediaType: (post.mediaType as any) || 'TEXT',
        });
      }

      if (!publishResult.success || !publishResult.postId) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            errorMessage: publishResult.error || `Failed to publish post to ${post.account.platform}`,
          },
        });
        results.push({ id: post.id, status: 'FAILED', error: publishResult.error });
        continue;
      }

      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          platformPostId: publishResult.postId,
          platformPostUrl: publishResult.postUrl,
          publishedAt: new Date(),
          errorMessage: null,
        },
      });

      // Handle attached first comments
      for (const comment of post.comments) {
        if (comment.delayMinutes === 0) {
          let commentResult;
          if (platform === 'LINKEDIN') {
            commentResult = await publishLinkedInComment({
              postUrn: publishResult.postId,
              accessToken: post.account.accessToken,
              message: comment.content,
            });
          } else if (platform === 'INSTAGRAM') {
            commentResult = await publishInstagramComment({
              mediaId: publishResult.postId,
              accessToken: post.account.accessToken,
              message: comment.content,
            });
          } else {
            commentResult = await publishFacebookComment({
              postId: publishResult.postId,
              accessToken: post.account.accessToken,
              message: comment.content,
            });
          }

          await prisma.comment.update({
            where: { id: comment.id },
            data: {
              status: commentResult.success ? 'PUBLISHED' : 'FAILED',
              platformCommentId: commentResult.commentId || null,
              publishedAt: commentResult.success ? new Date() : null,
              errorMessage: commentResult.error || null,
            },
          });
        } else {
          const scheduledCommentTime = new Date(Date.now() + comment.delayMinutes * 60 * 1000);
          await prisma.comment.update({
            where: { id: comment.id },
            data: {
              status: 'PENDING',
              scheduledAt: scheduledCommentTime,
            },
          });
        }
      }

      results.push({ id: post.id, status: 'PUBLISHED', postId: publishResult.postId });
    } catch (err: any) {
      console.error(`Error processing post ${post.id}:`, err);
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          errorMessage: err?.message || 'Unknown processing error',
        },
      });
      results.push({ id: post.id, status: 'FAILED', error: err?.message });
    }
  }

  return results;
}

/**
 * Process all pending comments that are due for publishing
 */
export async function processDueComments() {
  const now = new Date();

  const dueComments = await prisma.comment.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: {
        lte: now,
      },
    },
    include: {
      post: {
        include: {
          account: true,
        },
      },
    },
    take: 10,
  });

  const results = [];

  for (const comment of dueComments) {
    try {
      const parentPost = comment.post;
      if (!parentPost.platformPostId) {
        continue;
      }

      const platform = parentPost.account.platform;
      let commentResult;
      if (platform === 'LINKEDIN') {
        commentResult = await publishLinkedInComment({
          postUrn: parentPost.platformPostId,
          accessToken: parentPost.account.accessToken,
          message: comment.content,
        });
      } else if (platform === 'INSTAGRAM') {
        commentResult = await publishInstagramComment({
          mediaId: parentPost.platformPostId,
          accessToken: parentPost.account.accessToken,
          message: comment.content,
        });
      } else {
        commentResult = await publishFacebookComment({
          postId: parentPost.platformPostId,
          accessToken: parentPost.account.accessToken,
          message: comment.content,
        });
      }

      if (commentResult.success) {
        await prisma.comment.update({
          where: { id: comment.id },
          data: {
            status: 'PUBLISHED',
            platformCommentId: commentResult.commentId,
            publishedAt: new Date(),
            errorMessage: null,
          },
        });
        results.push({ id: comment.id, status: 'PUBLISHED' });
      } else {
        await prisma.comment.update({
          where: { id: comment.id },
          data: {
            status: 'FAILED',
            errorMessage: commentResult.error,
          },
        });
        results.push({ id: comment.id, status: 'FAILED', error: commentResult.error });
      }
    } catch (err: any) {
      console.error(`Error processing comment ${comment.id}:`, err);
      await prisma.comment.update({
        where: { id: comment.id },
        data: {
          status: 'FAILED',
          errorMessage: err?.message || 'Unknown comment error',
        },
      });
      results.push({ id: comment.id, status: 'FAILED', error: err?.message });
    }
  }

  return results;
}

/**
 * Process engagement milestone triggers (e.g. 10 likes -> comment, 20 comments -> comment)
 */
export async function processMilestoneTriggers() {
  // Find published posts that have untriggered milestone rules
  const postsWithMilestones = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      platformPostId: { not: null },
      milestones: {
        some: { isTriggered: false },
      },
    },
    include: {
      account: true,
      milestones: {
        where: { isTriggered: false },
      },
    },
    take: 10,
  });

  const results = [];

  for (const post of postsWithMilestones) {
    if (!post.platformPostId) continue;

    try {
      const platform = post.account.platform;
      let reactionsCount = 0;
      let commentsCount = 0;

      if (platform === 'LINKEDIN') {
        const stats = await getLinkedInEngagement(
          post.platformPostId,
          post.account.accessToken
        );
        reactionsCount = stats.reactionsCount;
        commentsCount = stats.commentsCount;
      } else if (platform === 'INSTAGRAM') {
        const stats = await getInstagramEngagement(
          post.platformPostId,
          post.account.accessToken
        );
        reactionsCount = stats.reactionsCount;
        commentsCount = stats.commentsCount;
      } else {
        const stats = await getPostEngagement(
          post.platformPostId,
          post.account.accessToken
        );
        reactionsCount = stats.reactionsCount;
        commentsCount = stats.commentsCount;
      }

      // Update post counts
      await prisma.post.update({
        where: { id: post.id },
        data: {
          reactionsCount,
          commentsCount,
          lastPolledAt: new Date(),
        },
      });

      // Check milestones
      for (const milestone of post.milestones) {
        let shouldTrigger = false;

        if (milestone.type === 'LIKES' && reactionsCount >= milestone.threshold) {
          shouldTrigger = true;
        } else if (milestone.type === 'COMMENTS' && commentsCount >= milestone.threshold) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          let commentResult;
          if (platform === 'LINKEDIN') {
            commentResult = await publishLinkedInComment({
              postUrn: post.platformPostId,
              accessToken: post.account.accessToken,
              message: milestone.commentText,
            });
          } else if (platform === 'INSTAGRAM') {
            commentResult = await publishInstagramComment({
              mediaId: post.platformPostId,
              accessToken: post.account.accessToken,
              message: milestone.commentText,
            });
          } else {
            commentResult = await publishFacebookComment({
              postId: post.platformPostId,
              accessToken: post.account.accessToken,
              message: milestone.commentText,
            });
          }

          await prisma.milestoneTrigger.update({
            where: { id: milestone.id },
            data: {
              isTriggered: true,
              triggeredAt: new Date(),
              platformCommentId: commentResult.commentId || null,
            },
          });

          results.push({
            milestoneId: milestone.id,
            postId: post.id,
            type: milestone.type,
            threshold: milestone.threshold,
            status: 'TRIGGERED',
          });
        }
      }
    } catch (err) {
      console.error(`Error checking milestones for post ${post.id}:`, err);
    }
  }

  return results;
}

/**
 * Format personalized reply text by tagging the commenter with @mention
 * Ensures commenter receives notification on Facebook / Instagram
 */
export function formatPersonalizedReply(
  template: string,
  commenterName?: string,
  isInstagram: boolean = false
): string {
  if (!commenterName) {
    return template.replace(/{(?:name|user)}/gi, '@user').replace(/@user/gi, '@user');
  }

  // Format mention tag
  // For Instagram: usernames don't have spaces; if name has spaces, replace with underscores or trim
  const cleanName = commenterName.trim();
  const mentionTag = isInstagram
    ? `@${cleanName.replace(/\s+/g, '_')}`
    : `@${cleanName}`;

  if (
    template.includes('{name}') ||
    template.includes('{user}') ||
    template.includes('@user')
  ) {
    return template
      .replace(/{name}/gi, mentionTag)
      .replace(/{user}/gi, mentionTag)
      .replace(/@user/gi, mentionTag);
  }

  // If user didn't write placeholder and didn't start with @mention, prepend it
  if (!template.trim().startsWith(mentionTag)) {
    return `${mentionTag} ${template.trim()}`;
  }

  return template;
}

/**
 * Process Auto-Reply to user comments on posts
 */
export async function processAutoReplies() {
  const postsWithAutoReply = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      platformPostId: { not: null },
      autoReply: {
        isEnabled: true,
      },
    },
    include: {
      account: true,
      autoReply: true,
    },
    take: 10,
  });

  const results = [];

  for (const post of postsWithAutoReply) {
    if (!post.platformPostId || !post.autoReply?.isEnabled) continue;

    try {
      const platform = post.account.platform;
      let recentComments: Array<{ id: string; message: string; fromId?: string; fromName?: string }> = [];

      if (platform === 'LINKEDIN') {
        recentComments = await getLinkedInRecentComments(
          post.platformPostId,
          post.account.accessToken,
          post.account.accountId
        );
      } else if (platform === 'INSTAGRAM') {
        recentComments = await getInstagramRecentComments(
          post.platformPostId,
          post.account.accessToken,
          post.account.accountId
        );
      } else {
        recentComments = await getPostRecentComments(
          post.platformPostId,
          post.account.accessToken,
          post.account.accountId
        );
      }

      for (const comment of recentComments) {
        if (comment.id === post.autoReply.lastRepliedCommentId) {
          // Already replied up to this comment
          break;
        }

        // Format personalized reply with commenter @mention
        const personalizedMessage = formatPersonalizedReply(
          post.autoReply.replyText,
          comment.fromName,
          platform === 'INSTAGRAM'
        );

        // Reply to user comment
        let replyRes;
        if (platform === 'LINKEDIN') {
          replyRes = await replyToLinkedInComment({
            postUrn: post.platformPostId,
            commentUrn: comment.id,
            accessToken: post.account.accessToken,
            message: personalizedMessage,
          });
        } else if (platform === 'INSTAGRAM') {
          replyRes = await replyToInstagramComment({
            commentId: comment.id,
            accessToken: post.account.accessToken,
            message: personalizedMessage,
          });
        } else {
          replyRes = await replyToComment({
            commentId: comment.id,
            accessToken: post.account.accessToken,
            message: personalizedMessage,
          });
        }

        if (replyRes.success) {
          await prisma.autoReplyRule.update({
            where: { id: post.autoReply.id },
            data: { lastRepliedCommentId: comment.id },
          });

          results.push({
            postId: post.id,
            commentId: comment.id,
            user: comment.fromName,
            status: 'REPLIED',
          });
          break; // Reply to one at a time to prevent rate limits
        }
      }
    } catch (err) {
      console.error(`Error in auto-reply for post ${post.id}:`, err);
    }
  }

  return results;
}

/**
 * Run all background scheduler and engagement automation jobs
 */
export async function processAllDueJobs() {
  const postResults = await processDuePosts();
  const commentResults = await processDueComments();
  const milestoneResults = await processMilestoneTriggers();
  const replyResults = await processAutoReplies();

  return {
    postsProcessed: postResults.length,
    posts: postResults,
    commentsProcessed: commentResults.length,
    comments: commentResults,
    milestonesTriggered: milestoneResults.length,
    milestones: milestoneResults,
    repliesSent: replyResults.length,
    replies: replyResults,
    timestamp: new Date().toISOString(),
  };
}