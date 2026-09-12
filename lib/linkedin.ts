import fs from 'fs';
import path from 'path';

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
      } else if (!resolvedId.startsWith('urn:li:')) {
        resolvedId = `urn:li:person:${resolvedId}`;
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
    const formattedAuthor = authorUrn.startsWith('urn:li:')
      ? authorUrn
      : /^\d+$/.test(authorUrn)
      ? `urn:li:organization:${authorUrn}`
      : `urn:li:person:${authorUrn}`;

    let publicMediaUrl = mediaUrl;
    if (mediaUrl && mediaUrl.startsWith('/uploads/')) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      publicMediaUrl = `${appUrl}${mediaUrl}`;
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
          shareMediaCategory: mediaUrl ? (mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE') : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    if (publicMediaUrl) {
      ugcPayload.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          originalUrl: publicMediaUrl,
          title: {
            text: commentary.slice(0, 30) || 'PostCraft Media',
          },
        },
      ];
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
