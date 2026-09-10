import fs from 'fs';
import path from 'path';

/**
 * Meta Graph API Integration Helper
 * Supports Facebook Page Posts, Videos, Engagement Polling, Auto-Replies & Comments
 */

export interface FacebookPageInfo {
  id: string;
  name: string;
  category?: string;
  avatar?: string;
  pageAccessToken: string;
}

export interface PublishPostParams {
  pageId: string;
  accessToken: string;
  message: string;
  mediaUrl?: string | null;
  mediaType?: 'TEXT' | 'IMAGE' | 'VIDEO';
}

export interface PublishCommentParams {
  postId: string;
  accessToken: string;
  message: string;
}

const GRAPH_API_VERSION = 'v20.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Verify Facebook Page Token and fetch details (auto-extracts Page Access Token if User Token is provided)
 */
export async function verifyFacebookPage(
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; data?: FacebookPageInfo; error?: string }> {
  if (accessToken.startsWith('TEST_') || pageId.startsWith('TEST_')) {
    return {
      success: true,
      data: {
        id: pageId || '1092837465',
        name: 'Demo Facebook Page (Simulated)',
        category: 'Product/Service',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        pageAccessToken: accessToken,
      },
    };
  }

  try {
    const url = `${GRAPH_BASE_URL}/${pageId}?fields=id,name,category,picture{url},access_token&access_token=${encodeURIComponent(
      accessToken
    )}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Failed to verify Facebook Page credentials.',
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        category: data.category,
        avatar: data.picture?.data?.url || null,
        pageAccessToken: data.access_token || accessToken,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error connecting to Facebook Graph API',
    };
  }
}

/**
 * Publish post (Text, Image, or Video) to a Facebook Page with binary upload support
 */
export async function publishFacebookPost(params: PublishPostParams): Promise<{
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}> {
  const { pageId, accessToken, message, mediaUrl, mediaType = 'TEXT' } = params;

  if (accessToken.startsWith('TEST_') || pageId.startsWith('TEST_')) {
    const mockPostId = `${pageId}_${Date.now()}`;
    return {
      success: true,
      postId: mockPostId,
      postUrl: `https://facebook.com/${mockPostId}`,
    };
  }

  try {
    // Check if media is a local uploaded file
    const isLocalUpload = mediaUrl && mediaUrl.startsWith('/uploads/');
    const isRemoteUrl = mediaUrl && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'));

    // Case 1: Video Post
    if (mediaType === 'VIDEO' && mediaUrl) {
      const endpoint = `${GRAPH_BASE_URL}/${pageId}/videos`;

      if (isLocalUpload) {
        const localFilePath = path.join(process.cwd(), 'public', mediaUrl);
        if (fs.existsSync(localFilePath)) {
          const fileBuffer = fs.readFileSync(localFilePath);
          const ext = path.extname(localFilePath).toLowerCase();
          const mime = ext === '.mov' ? 'video/quicktime' : 'video/mp4';
          const blob = new Blob([fileBuffer], { type: mime });

          const formData = new FormData();
          formData.append('source', blob, path.basename(localFilePath));
          formData.append('description', message);
          formData.append('access_token', accessToken);

          const res = await fetch(endpoint, { method: 'POST', body: formData });
          const data = await res.json();

          if (!res.ok || data.error) {
            return { success: false, error: data.error?.message || 'Failed to upload video' };
          }

          const videoId = data.id;
          return {
            success: true,
            postId: `${pageId}_${videoId}`,
            postUrl: `https://www.facebook.com/${videoId}`,
          };
        }
      } else if (isRemoteUrl) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_url: mediaUrl,
            description: message,
            access_token: accessToken,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          return { success: false, error: data.error?.message || 'Failed to upload video from URL' };
        }
        return {
          success: true,
          postId: `${pageId}_${data.id}`,
          postUrl: `https://www.facebook.com/${data.id}`,
        };
      }
    }

    // Case 2: Image / Photo Post
    if (mediaType === 'IMAGE' && mediaUrl) {
      const endpoint = `${GRAPH_BASE_URL}/${pageId}/photos`;

      if (isLocalUpload) {
        const localFilePath = path.join(process.cwd(), 'public', mediaUrl);
        if (fs.existsSync(localFilePath)) {
          const fileBuffer = fs.readFileSync(localFilePath);
          const ext = path.extname(localFilePath).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
          const blob = new Blob([fileBuffer], { type: mime });

          const formData = new FormData();
          formData.append('source', blob, path.basename(localFilePath));
          formData.append('caption', message);
          formData.append('access_token', accessToken);

          const res = await fetch(endpoint, { method: 'POST', body: formData });
          const data = await res.json();

          if (!res.ok || data.error) {
            return { success: false, error: data.error?.message || 'Failed to upload photo' };
          }

          const photoPostId = data.post_id || data.id;
          return {
            success: true,
            postId: photoPostId,
            postUrl: `https://www.facebook.com/${photoPostId}`,
          };
        }
      } else if (isRemoteUrl) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: mediaUrl,
            caption: message,
            access_token: accessToken,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          return { success: false, error: data.error?.message || 'Failed to upload photo from URL' };
        }
        const photoPostId = data.post_id || data.id;
        return {
          success: true,
          postId: photoPostId,
          postUrl: `https://www.facebook.com/${photoPostId}`,
        };
      }
    }

    // Case 3: Text Post
    const endpoint = `${GRAPH_BASE_URL}/${pageId}/feed`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        access_token: accessToken,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Facebook API error publishing post',
      };
    }

    const postId = data.post_id || data.id;
    const postUrl = `https://www.facebook.com/${postId}`;

    return {
      success: true,
      postId,
      postUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to connect to Facebook API',
    };
  }
}

/**
 * Publish a comment on a Facebook Post
 */
export async function publishFacebookComment(params: PublishCommentParams): Promise<{
  success: boolean;
  commentId?: string;
  error?: string;
}> {
  const { postId, accessToken, message } = params;

  if (accessToken.startsWith('TEST_') || postId.includes('TEST_')) {
    return {
      success: true,
      commentId: `comment_${Date.now()}`,
    };
  }

  try {
    const endpoint = `${GRAPH_BASE_URL}/${postId}/comments`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        access_token: accessToken,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || 'Facebook API error publishing comment',
      };
    }

    return {
      success: true,
      commentId: data.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to publish comment to Facebook',
    };
  }
}

/**
 * Reply directly to a user's comment
 */
export async function replyToComment(params: {
  commentId: string;
  accessToken: string;
  message: string;
}): Promise<{ success: boolean; replyId?: string; error?: string }> {
  const { commentId, accessToken, message } = params;

  if (accessToken.startsWith('TEST_') || commentId.startsWith('TEST_')) {
    return { success: true, replyId: `reply_${Date.now()}` };
  }

  try {
    const endpoint = `${GRAPH_BASE_URL}/${commentId}/comments`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        access_token: accessToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message || 'Failed to reply to comment' };
    }

    return { success: true, replyId: data.id };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Network error replying to comment' };
  }
}

/**
 * Fetch live engagement counts (Reactions/Likes & Comments) for a Facebook Post
 */
export async function getPostEngagement(
  postId: string,
  accessToken: string
): Promise<{ reactionsCount: number; commentsCount: number }> {
  if (accessToken.startsWith('TEST_') || postId.includes('TEST_')) {
    return { reactionsCount: 15, commentsCount: 25 };
  }

  try {
    const url = `${GRAPH_BASE_URL}/${postId}?fields=reactions.summary(total_count),comments.summary(total_count)&access_token=${encodeURIComponent(
      accessToken
    )}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      return { reactionsCount: 0, commentsCount: 0 };
    }

    const reactionsCount = data.reactions?.summary?.total_count || 0;
    const commentsCount = data.comments?.summary?.total_count || 0;

    return { reactionsCount, commentsCount };
  } catch (error) {
    return { reactionsCount: 0, commentsCount: 0 };
  }
}

/**
 * Fetch recent comments on a post to detect new user comments for auto-reply
 */
export async function getPostRecentComments(
  postId: string,
  accessToken: string,
  pageId: string
): Promise<Array<{ id: string; message: string; fromId?: string; fromName?: string }>> {
  if (accessToken.startsWith('TEST_') || postId.includes('TEST_')) {
    return [
      { id: `test_user_comment_${Date.now()}`, message: 'Great post! How can I order?', fromId: 'user_123', fromName: 'Customer' },
    ];
  }

  try {
    const url = `${GRAPH_BASE_URL}/${postId}/comments?filter=stream&order=reverse_chronological&fields=id,message,from{id,name}&limit=15&access_token=${encodeURIComponent(
      accessToken
    )}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.data) {
      return [];
    }

    return data.data
      .filter((c: any) => c.from?.id !== pageId)
      .map((c: any) => ({
        id: c.id,
        message: c.message,
        fromId: c.from?.id,
        fromName: c.from?.name,
      }));
  } catch (error) {
    return [];
  }
}