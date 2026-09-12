import fs from 'fs';
import path from 'path';

/**
 * Meta Graph API Integration for Instagram Professional (Business & Creator) Accounts
 * Supports 2-step media container publishing (Images & Reels), First Comments, Auto-Replies & Analytics
 */

export interface InstagramAccountInfo {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  accessToken: string;
}

export interface PublishInstagramPostParams {
  igUserId: string;
  accessToken: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
}

export interface PublishInstagramCommentParams {
  mediaId: string;
  accessToken: string;
  message: string;
}

const GRAPH_API_VERSION = 'v20.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Verify Instagram Business Account ID & Access Token
 */
export async function verifyInstagramAccount(
  igAccountId: string,
  accessToken: string
): Promise<{ success: boolean; data?: InstagramAccountInfo; error?: string }> {
  // Support Simulated Test Accounts
  if (accessToken.startsWith('TEST_') || igAccountId.startsWith('TEST_')) {
    return {
      success: true,
      data: {
        id: igAccountId || 'TEST_IG_987654321',
        username: 'postcraft.official',
        name: 'PostCraft Instagram (Simulated)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        accessToken: accessToken,
      },
    };
  }

  try {
    const url = `${GRAPH_BASE_URL}/${igAccountId}?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(
      accessToken
    )}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Failed to verify Instagram Business account credentials.',
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        username: data.username || data.name || 'Instagram User',
        name: data.name || data.username,
        avatar: data.profile_picture_url || null,
        accessToken,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error connecting to Instagram Graph API',
    };
  }
}

/**
 * Publish Image or Video to Instagram via 2-Step Container Flow
 * 1. Create Media Container -> 2. Poll Status (for video) -> 3. Media Publish
 */
export async function publishInstagramPost(params: PublishInstagramPostParams): Promise<{
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}> {
  const { igUserId, accessToken, caption, mediaUrl, mediaType } = params;

  // Handle Simulated Accounts
  if (accessToken.startsWith('TEST_') || igUserId.startsWith('TEST_')) {
    const mockPostId = `ig_${Date.now()}`;
    return {
      success: true,
      postId: mockPostId,
      postUrl: `https://www.instagram.com/p/${mockPostId}/`,
    };
  }

  try {
    // Resolve public URL for local media
    let publicMediaUrl = mediaUrl;
    if (mediaUrl && mediaUrl.startsWith('/uploads/')) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      publicMediaUrl = `${appUrl}${mediaUrl}`;
    }

    if (!publicMediaUrl) {
      return {
        success: false,
        error: 'Instagram requires an image or video URL to publish a post.',
      };
    }

    // Step 1: Create media container
    let containerPayload: any = {
      caption: caption || '',
      access_token: accessToken,
    };

    if (mediaType === 'VIDEO') {
      containerPayload.video_url = publicMediaUrl;
      containerPayload.media_type = 'REELS';
    } else {
      containerPayload.image_url = publicMediaUrl;
    }

    const containerUrl = `${GRAPH_BASE_URL}/${igUserId}/media`;
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerPayload),
    });

    const containerData = await containerRes.json();
    if (!containerRes.ok || containerData.error || !containerData.id) {
      return {
        success: false,
        error: containerData.error?.message || 'Failed to create Instagram media container.',
      };
    }

    const creationId = containerData.id;

    // Step 2: For videos, poll status until container is ready (FINISHED)
    if (mediaType === 'VIDEO') {
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 15;

      while (!isReady && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusUrl = `${GRAPH_BASE_URL}/${creationId}?fields=status_code&access_token=${encodeURIComponent(
          accessToken
        )}`;
        const statusRes = await fetch(statusUrl);
        const statusData = await statusRes.json();

        if (statusData.status_code === 'FINISHED') {
          isReady = true;
        } else if (statusData.status_code === 'ERROR' || statusData.status_code === 'EXPIRED') {
          return {
            success: false,
            error: 'Instagram media container processing failed on Meta servers.',
          };
        }
      }
    }

    // Step 3: Publish container
    const publishUrl = `${GRAPH_BASE_URL}/${igUserId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error || !publishData.id) {
      return {
        success: false,
        error: publishData.error?.message || 'Failed to publish Instagram media container.',
      };
    }

    const postId = publishData.id;

    // Fetch permalink for direct Instagram link
    let postUrl = `https://www.instagram.com/`;
    try {
      const linkRes = await fetch(
        `${GRAPH_BASE_URL}/${postId}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`
      );
      const linkData = await linkRes.json();
      if (linkData.permalink) {
        postUrl = linkData.permalink;
      }
    } catch {
      // Ignore permalink fallback
    }

    return {
      success: true,
      postId,
      postUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error publishing to Instagram Graph API',
    };
  }
}

/**
 * Publish a comment on an Instagram Post
 */
export async function publishInstagramComment(params: PublishInstagramCommentParams): Promise<{
  success: boolean;
  commentId?: string;
  error?: string;
}> {
  const { mediaId, accessToken, message } = params;

  if (accessToken.startsWith('TEST_') || mediaId.startsWith('TEST_') || mediaId.startsWith('ig_')) {
    return {
      success: true,
      commentId: `ig_comment_${Date.now()}`,
    };
  }

  try {
    const endpoint = `${GRAPH_BASE_URL}/${mediaId}/comments`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Failed to post comment on Instagram',
      };
    }

    return {
      success: true,
      commentId: data.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error posting Instagram comment',
    };
  }
}

/**
 * Reply directly to an Instagram user's comment
 */
export async function replyToInstagramComment(params: {
  commentId: string;
  accessToken: string;
  message: string;
}): Promise<{ success: boolean; replyId?: string; error?: string }> {
  const { commentId, accessToken, message } = params;

  if (accessToken.startsWith('TEST_') || commentId.startsWith('TEST_') || commentId.startsWith('ig_')) {
    return { success: true, replyId: `ig_reply_${Date.now()}` };
  }

  try {
    const endpoint = `${GRAPH_BASE_URL}/${commentId}/replies`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Failed to reply to Instagram comment',
      };
    }

    return { success: true, replyId: data.id };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error replying to Instagram comment',
    };
  }
}

/**
 * Fetch live engagement metrics (Likes & Comments) for an Instagram Media Post
 */
export async function getInstagramEngagement(
  mediaId: string,
  accessToken: string
): Promise<{ reactionsCount: number; commentsCount: number }> {
  if (accessToken.startsWith('TEST_') || mediaId.startsWith('TEST_') || mediaId.startsWith('ig_')) {
    return { reactionsCount: 28, commentsCount: 12 };
  }

  try {
    const url = `${GRAPH_BASE_URL}/${mediaId}?fields=like_count,comments_count&access_token=${encodeURIComponent(
      accessToken
    )}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      return { reactionsCount: 0, commentsCount: 0 };
    }

    return {
      reactionsCount: Number(data.like_count) || 0,
      commentsCount: Number(data.comments_count) || 0,
    };
  } catch {
    return { reactionsCount: 0, commentsCount: 0 };
  }
}

/**
 * Fetch recent comments on an Instagram post to detect incoming comments for auto-reply
 */
export async function getInstagramRecentComments(
  mediaId: string,
  accessToken: string,
  igUserId: string
): Promise<Array<{ id: string; message: string; fromId?: string; fromName?: string }>> {
  if (accessToken.startsWith('TEST_') || mediaId.startsWith('TEST_') || mediaId.startsWith('ig_')) {
    return [
      {
        id: `ig_user_comment_${Date.now()}`,
        message: 'Loving this! DM me the link please 🙌',
        fromId: 'user_456',
        fromName: 'insta_fan',
      },
    ];
  }

  try {
    const url = `${GRAPH_BASE_URL}/${mediaId}/comments?fields=id,text,from{id,username}&limit=15&access_token=${encodeURIComponent(
      accessToken
    )}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.data) {
      return [];
    }

    return data.data
      .filter((c: any) => c.from?.id !== igUserId)
      .map((c: any) => ({
        id: c.id,
        message: c.text,
        fromId: c.from?.id,
        fromName: c.from?.username,
      }));
  } catch {
    return [];
  }
}
