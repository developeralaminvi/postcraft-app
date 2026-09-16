import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * LinkedIn Community Management & UGC API Integration
 * Supports Person & Organization/Company Pages, Text/Image/Video Posts,
 * Comments, Comment Auto-Replies with @mentions, and Analytics.
 */

export interface LinkedInAccountInfo {
  id: string; // e.g. urn:li:person:12345 or urn:li:organization:67890
  name: string;
  avatar?: string | null;
  headline?: string;
  accessToken: string;
  isOrganization: boolean;
}

export interface PublishLinkedInPostParams {
  authorUrn: string;
  accessToken: string;
  commentary: string;
  mediaUrl?: string | null;
  mediaType?: 'TEXT' | 'IMAGE' | 'VIDEO';
}

export interface PublishLinkedInCommentParams {
  postUrn: string;
  accessToken: string;
  message: string;
}

const LINKEDIN_API_BASE = 'https://api.linkedin.com';

/**
 * Upload binary media (Image or Video) to LinkedIn Asset Storage
 */
export async function uploadLinkedInMediaAsset(
  authorUrn: string,
  accessToken: string,
  mediaUrl: string,
  mediaType: 'IMAGE' | 'VIDEO' = 'IMAGE'
): Promise<{ success: boolean; assetUrn?: string; error?: string }> {
  try {
    let fileBuffer: Buffer | null = null;
    let mimeType = mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg';

    if (mediaUrl.startsWith('data:')) {
      const match = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        fileBuffer = Buffer.from(match[2], 'base64');
      }
    } else if (mediaUrl.startsWith('/uploads/')) {
      const filename = path.basename(mediaUrl);
      let localPath = path.join(process.cwd(), 'public', 'uploads', filename);
      if (!fs.existsSync(localPath)) {
        localPath = path.join(os.tmpdir(), 'postcraft_uploads', filename);
      }
      if (fs.existsSync(localPath)) {
        fileBuffer = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase();
        mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : ext === '.mp4' ? 'video/mp4' : 'image/jpeg';
      }
    } else if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      const res = await fetch(mediaUrl);
      if (res.ok) {
        const ct = res.headers.get('content-type');
        if (ct) mimeType = ct;
        fileBuffer = Buffer.from(await res.arrayBuffer());
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return { success: false, error: 'Could not load media binary for LinkedIn upload' };
    }

    // Step 1: Register upload with LinkedIn Assets API
    const isVideo = mediaType === 'VIDEO';
    const recipe = isVideo
      ? 'urn:li:digitalmediaRecipe:feedshare-video'
      : 'urn:li:digitalmediaRecipe:feedshare-image';

    const regRes = await fetch(`${LINKEDIN_API_BASE}/v2/assets?action=registerUpload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: [recipe],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      }),
    });

    const regData = await regRes.json();
    if (!regRes.ok || !regData.value) {
      return { success: false, error: regData.message || 'Failed to register media with LinkedIn' };
    }

    const uploadUrl =
      regData.value.uploadMechanism?.[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ]?.uploadUrl;
    const assetUrn = regData.value.asset;

    if (!uploadUrl || !assetUrn) {
      return { success: false, error: 'LinkedIn asset upload URL missing' };
    }

    // Step 2: Upload file buffer to signed uploadUrl
    const upRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!upRes.ok) {
      return { success: false, error: `LinkedIn binary upload failed (HTTP ${upRes.status})` };
    }

    return { success: true, assetUrn };
  } catch (err: any) {
    return { success: false, error: err?.message || 'LinkedIn media upload exception' };
  }
}

/**
 * Verify LinkedIn Author URN and Access Token
 */
export async function verifyLinkedInAccount(
  authorUrn: string,
  accessToken: string
): Promise<{ success: boolean; data?: LinkedInAccountInfo; error?: string }> {
  // Support Simulated Test Accounts
  if (accessToken.startsWith('TEST_') || authorUrn.startsWith('TEST_') || authorUrn.includes('TEST_LI_')) {
    const isOrg = authorUrn.includes('organization');
    return {
      success: true,
      data: {
        id: authorUrn.startsWith('urn:li:') ? authorUrn : `urn:li:person:${authorUrn}`,
        name: isOrg ? 'PostCraft Enterprise Solutions' : 'Alamin Developer',
        avatar: isOrg
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        headline: isOrg ? 'Technology, Information and Internet · 45K followers' : 'Senior Full-Stack Software Engineer | Cloud & AI',
        accessToken: accessToken,
        isOrganization: isOrg,
      },
    };
  }

  try {
    let cleanedUrn = authorUrn.trim();
    // 1. Auto-extract numeric ID if user pasted a full company URL
    const urlMatch = cleanedUrn.match(/\/company\/(\d+)/);
    if (urlMatch) {
      cleanedUrn = `urn:li:organization:${urlMatch[1]}`;
    }

    // 2. Auto-detect if user entered just numeric digits (e.g. 12345678)
    const isPureDigits = /^\d+$/.test(cleanedUrn);
    if (isPureDigits) {
      cleanedUrn = `urn:li:organization:${cleanedUrn}`;
    }

    const isOrg = cleanedUrn.includes('organization');
    let name = 'LinkedIn Member';
    let avatar: string | null = null;
    let headline = 'Professional on LinkedIn';
    let resolvedId = cleanedUrn;

    if (isOrg) {
      // Organization / Company Page
      const orgIdMatch = cleanedUrn.match(/organization:(\d+)/);
      const orgId = orgIdMatch ? orgIdMatch[1] : cleanedUrn;
      resolvedId = `urn:li:organization:${orgId}`;

      const res = await fetch(`${LINKEDIN_API_BASE}/v2/organizations/${orgId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });
      const data = await res.json();
      if (!res.ok || data.status >= 400) {
        return {
          success: false,
          error: data.message || 'Failed to verify LinkedIn Company Page credentials. Make sure you have admin rights and w_organization_social scope.',
        };
      }
      name = data.localizedName || data.vanityName || 'LinkedIn Company Page';
      headline = 'Company Page on LinkedIn';
    } else {
      // Member Profile (User Info Endpoint - OpenID / OAuth2)
      const res = await fetch(`${LINKEDIN_API_BASE}/v2/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return {
          success: false,
          error: data.error_description || data.message || 'Failed to verify LinkedIn Member Profile credentials.',
        };
      }
      name = data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim() || 'LinkedIn Member';
      avatar = data.picture || null;
      headline = 'Member Profile on LinkedIn';
      const personSub = data.sub || data.id;
      if (personSub) {
        resolvedId = `urn:li:person:${personSub}`;
      }
    }

    return {
      success: true,
      data: {
        id: resolvedId,
        name,
        avatar,
        headline,
        accessToken,
        isOrganization: isOrg,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error connecting to LinkedIn API',
    };
  }
}

/**
 * Publish Text, Image, or Video Post to LinkedIn Community Feed
 */
export async function publishLinkedInPost(params: PublishLinkedInPostParams): Promise<{
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}> {
  const { authorUrn, accessToken, commentary, mediaUrl, mediaType } = params;

  // Handle Simulated Accounts
  if (accessToken.startsWith('TEST_') || authorUrn.startsWith('TEST_') || authorUrn.includes('TEST_LI_')) {
    const mockShareId = `urn:li:share:${Date.now()}`;
    return {
      success: true,
      postId: mockShareId,
      postUrl: `https://www.linkedin.com/feed/update/${mockShareId}/`,
    };
  }

  try {
    // Auto-resolve author if containing 'me' or incomplete URN
    let formattedAuthor = authorUrn.trim();
    if (formattedAuthor.includes('me') || !formattedAuthor.startsWith('urn:li:')) {
      try {
        const uInfoRes = await fetch(`${LINKEDIN_API_BASE}/v2/userinfo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (uInfoRes.ok) {
          const uData = await uInfoRes.json();
          const sub = uData.sub || uData.id;
          if (sub) {
            formattedAuthor = `urn:li:person:${sub}`;
          }
        }
      } catch {
        // keep existing formattedAuthor
      }
    }
    if (!formattedAuthor.startsWith('urn:li:')) {
      formattedAuthor = /^\d+$/.test(formattedAuthor)
        ? `urn:li:organization:${formattedAuthor}`
        : `urn:li:person:${formattedAuthor}`;
    }

    // Handle Media Upload if present
    let mediaPayload: any = null;
    let shareCategory = 'NONE';

    if (mediaUrl) {
      const isVideo = mediaType === 'VIDEO';
      const isPublicWebUrl =
        (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) &&
        !mediaUrl.includes('localhost') &&
        !mediaUrl.includes('127.0.0.1');

      if (isPublicWebUrl) {
        shareCategory = isVideo ? 'VIDEO' : 'IMAGE';
        mediaPayload = [
          {
            status: 'READY',
            originalUrl: mediaUrl,
            title: { text: commentary.slice(0, 30) || 'PostCraft Media' },
          },
        ];
      } else {
        // Upload directly as a LinkedIn digital media asset
        const assetResult = await uploadLinkedInMediaAsset(
          formattedAuthor,
          accessToken,
          mediaUrl,
          mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE'
        );

        if (assetResult.success && assetResult.assetUrn) {
          shareCategory = isVideo ? 'VIDEO' : 'IMAGE';
          mediaPayload = [
            {
              status: 'READY',
              media: assetResult.assetUrn,
              title: { text: commentary.slice(0, 30) || 'PostCraft Media' },
            },
          ];
        } else {
          console.warn('LinkedIn asset upload failed, falling back to text post:', assetResult.error);
          shareCategory = 'NONE';
        }
      }
    }

    // Build LinkedIn UGC Post Payload
    const ugcPayload: any = {
      author: formattedAuthor,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: commentary || '',
          },
          shareMediaCategory: shareCategory,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    if (mediaPayload && mediaPayload.length > 0) {
      ugcPayload.specificContent['com.linkedin.ugc.ShareContent'].media = mediaPayload;
    }

    const res = await fetch(`${LINKEDIN_API_BASE}/v2/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(ugcPayload),
    });

    const data = await res.json();
    if (!res.ok || data.status >= 400 || data.error) {
      return {
        success: false,
        error: data.message || 'LinkedIn API error publishing post',
      };
    }

    const shareUrn = data.id || `urn:li:share:${Date.now()}`;
    return {
      success: true,
      postId: shareUrn,
      postUrl: `https://www.linkedin.com/feed/update/${shareUrn}/`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to publish post to LinkedIn',
    };
  }
}

/**
 * Publish automated comment to LinkedIn post
 */
export async function publishLinkedInComment(params: PublishLinkedInCommentParams): Promise<{
  success: boolean;
  commentId?: string;
  error?: string;
}> {
  const { postUrn, accessToken, message } = params;

  if (accessToken.startsWith('TEST_') || postUrn.includes('TEST_')) {
    return {
      success: true,
      commentId: `urn:li:comment:(${postUrn},${Date.now()})`,
    };
  }

  try {
    const endpoint = `${LINKEDIN_API_BASE}/v2/socialActions/${encodeURIComponent(postUrn)}/comments`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        message: { text: message },
      }),
    });

    const data = await res.json();
    if (!res.ok || data.status >= 400) {
      return {
        success: false,
        error: data.message || 'Failed to publish comment to LinkedIn',
      };
    }

    return {
      success: true,
      commentId: data.id || `urn:li:comment:${Date.now()}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error publishing comment on LinkedIn',
    };
  }
}

/**
 * Reply directly to a LinkedIn user comment
 */
export async function replyToLinkedInComment(params: {
  postUrn: string;
  commentUrn: string;
  accessToken: string;
  message: string;
}): Promise<{ success: boolean; replyId?: string; error?: string }> {
  const { postUrn, commentUrn, accessToken, message } = params;

  if (accessToken.startsWith('TEST_') || postUrn.includes('TEST_') || commentUrn.includes('TEST_')) {
    return { success: true, replyId: `urn:li:comment:reply_${Date.now()}` };
  }

  try {
    const endpoint = `${LINKEDIN_API_BASE}/v2/socialActions/${encodeURIComponent(postUrn)}/comments`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        parentComment: commentUrn,
        message: { text: message },
      }),
    });

    const data = await res.json();
    if (!res.ok || data.status >= 400) {
      return { success: false, error: data.message || 'Failed to reply to LinkedIn comment' };
    }

    return { success: true, replyId: data.id || `reply_${Date.now()}` };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Network error replying to LinkedIn comment' };
  }
}

/**
 * Fetch live engagement counts (Reactions/Likes & Comments) for a LinkedIn Post
 */
export async function getLinkedInEngagement(
  postUrn: string,
  accessToken: string
): Promise<{ reactionsCount: number; commentsCount: number }> {
  if (accessToken.startsWith('TEST_') || postUrn.includes('TEST_')) {
    return { reactionsCount: 42, commentsCount: 18 };
  }

  try {
    const url = `${LINKEDIN_API_BASE}/v2/socialActions/${encodeURIComponent(postUrn)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
    const data = await res.json();

    if (!res.ok || data.status >= 400) {
      return { reactionsCount: 0, commentsCount: 0 };
    }

    const reactionsCount = data.likesSummary?.totalLikes || 0;
    const commentsCount = data.commentsSummary?.totalComments || 0;

    return { reactionsCount, commentsCount };
  } catch {
    return { reactionsCount: 0, commentsCount: 0 };
  }
}

/**
 * Fetch recent comments on a LinkedIn post to detect incoming comments for auto-reply
 */
export async function getLinkedInRecentComments(
  postUrn: string,
  accessToken: string,
  authorUrn: string
): Promise<Array<{ id: string; message: string; fromId?: string; fromName?: string }>> {
  if (accessToken.startsWith('TEST_') || postUrn.includes('TEST_')) {
    return [
      {
        id: `urn:li:comment:test_${Date.now()}`,
        message: 'Insightful thoughts on AI engineering! Would love to connect.',
        fromId: 'urn:li:person:user_li_99',
        fromName: 'Rafiqul Islam',
      },
    ];
  }

  try {
    const url = `${LINKEDIN_API_BASE}/v2/socialActions/${encodeURIComponent(postUrn)}/comments?count=15`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
    const data = await res.json();

    if (!res.ok || !data.elements) {
      return [];
    }

    return data.elements
      .filter((c: any) => c.actor !== authorUrn)
      .map((c: any) => ({
        id: c.$URN || c.id,
        message: c.message?.text || '',
        fromId: c.actor,
        fromName: c.actor ? c.actor.replace(/urn:li:person:/, '').replace(/urn:li:organization:/, '') : 'LinkedIn Member',
      }));
  } catch {
    return [];
  }
}
