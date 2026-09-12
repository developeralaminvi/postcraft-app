import fs from 'fs';
import path from 'path';

/**
 * WordPress REST API Integration Engine
 * Supports Self-Hosted WordPress & WordPress.com with REST API enabled.
 * Handles Site Verification, Category Discovery, Media Upload,
 * HTML Post Publishing, Statuses (Publish, Future/Schedule, Draft), and Comments.
 */

export interface WordPressAccountInfo {
  id: string; // Site URL (normalized)
  name: string; // Site title
  avatar?: string | null;
  siteUrl: string;
  username: string;
  accessToken: string; // Stored as `username:::appPassword` or base64 token
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

export interface PublishWordPressPostParams {
  siteUrl: string;
  credentials: string; // `username:::appPassword` or base64
  title?: string;
  content: string; // HTML supported
  status?: 'publish' | 'future' | 'draft' | 'pending' | 'private';
  scheduledAt?: string | Date | null;
  categories?: (number | string)[];
  tags?: (number | string)[];
  mediaUrl?: string | null;
  excerpt?: string | null;
}

export interface PublishWordPressCommentParams {
  siteUrl: string;
  credentials: string;
  postId: string | number;
  content: string;
}

/**
 * Helper to normalize and strip trailing slash from WordPress site URL
 */
export function normalizeSiteUrl(url: string): string {
  let cleaned = url.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, '');
}

/**
 * Parse credentials into HTTP Basic Auth header
 */
export function getBasicAuthHeader(credentials: string): string {
  if (credentials.includes(':::')) {
    const [user, pass] = credentials.split(':::');
    // Remove spaces from WordPress Application Passwords (e.g., "abcd efgh ijkl mnop")
    const cleanPass = pass.replace(/\s+/g, '');
    return 'Basic ' + Buffer.from(`${user.trim()}:${cleanPass}`).toString('base64');
  }
  // If already base64 or custom bearer
  if (credentials.startsWith('Basic ') || credentials.startsWith('Bearer ')) {
    return credentials;
  }
  return 'Basic ' + credentials;
}

/**
 * Verify WordPress Site Connection & Application Password
 */
export async function verifyWordPressAccount(
  siteUrlInput: string,
  usernameInput: string,
  appPasswordInput: string
): Promise<{ success: boolean; data?: WordPressAccountInfo; error?: string }> {
  const siteUrl = normalizeSiteUrl(siteUrlInput);
  const username = usernameInput.trim();
  const appPassword = appPasswordInput.trim();

  // 1. Simulated Demo Test Account Handling
  if (
    siteUrl.includes('test') ||
    siteUrl.includes('example.com') ||
    appPassword.startsWith('TEST_') ||
    username.toLowerCase() === 'demouser'
  ) {
    return {
      success: true,
      data: {
        id: siteUrl,
        name: 'TechCraft WordPress Magazine',
        avatar: 'https://s.w.org/style/images/about/WordPress-logotype-wmark.png',
        siteUrl,
        username,
        accessToken: `${username}:::${appPassword}`,
      },
    };
  }

  try {
    const authHeader = getBasicAuthHeader(`${username}:::${appPassword}`);

    // Fetch site info from root index
    let siteName = 'WordPress Site';
    let siteAvatar: string | null = 'https://s.w.org/style/images/about/WordPress-logotype-wmark.png';

    try {
      const siteRes = await fetch(`${siteUrl}/wp-json/`, {
        headers: { Accept: 'application/json' },
      });
      if (siteRes.ok) {
        const siteData = await siteRes.json();
        if (siteData.name) {
          siteName = siteData.name;
        }
        if (siteData.site_icon_url) {
          siteAvatar = siteData.site_icon_url;
        }
      }
    } catch {
      // Non-blocking: continue to user authentication
    }

    // Verify User Credentials against /wp-json/wp/v2/users/me
    const userRes = await fetch(`${siteUrl}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    const userData = await userRes.json();

    if (!userRes.ok || userData.code || userData.error) {
      const errMsg =
        userData.message ||
        userData.error ||
        `WordPress authentication failed (HTTP ${userRes.status}). Please check your Site URL, Username, and Application Password.`;
      return { success: false, error: errMsg };
    }

    if (userData.avatar_urls && userData.avatar_urls['96']) {
      siteAvatar = userData.avatar_urls['96'];
    }

    return {
      success: true,
      data: {
        id: siteUrl,
        name: siteName || userData.name || `${username}'s Blog`,
        avatar: siteAvatar,
        siteUrl,
        username,
        accessToken: `${username}:::${appPassword}`,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Could not connect to WordPress site at ${siteUrl}. Error: ${err?.message || 'Network unreachable'}`,
    };
  }
}

/**
 * Fetch Categories from WordPress
 */
export async function getWordPressCategories(
  siteUrlInput: string,
  credentials: string
): Promise<WordPressCategory[]> {
  const siteUrl = normalizeSiteUrl(siteUrlInput);

  // Return default mock categories for simulated test accounts
  if (
    siteUrl.includes('test') ||
    siteUrl.includes('example.com') ||
    credentials.includes('TEST_')
  ) {
    return [
      { id: 1, name: 'Technology', slug: 'technology', count: 28 },
      { id: 2, name: 'Digital Marketing', slug: 'digital-marketing', count: 19 },
      { id: 3, name: 'Web Development', slug: 'web-dev', count: 34 },
      { id: 4, name: 'Artificial Intelligence', slug: 'ai', count: 42 },
      { id: 5, name: 'Updates & Announcements', slug: 'updates', count: 12 },
    ];
  }

  try {
    const authHeader = getBasicAuthHeader(credentials);
    const res = await fetch(`${siteUrl}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,slug,count`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return [];
    }

    const categories = await res.json();
    if (!Array.isArray(categories)) {
      return [];
    }

    return categories.map((cat: any) => {
      const rawName = String(cat.name || 'Uncategorized');
      const cleanName = rawName
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
      return {
        id: Number(cat.id),
        name: cleanName,
        slug: String(cat.slug || ''),
        count: Number(cat.count || 0),
      };
    });
  } catch (err) {
    console.error('Error fetching WordPress categories:', err);
    return [];
  }
}

/**
 * Upload an image to WordPress Media Library and return media ID
 */
export async function uploadWordPressMedia(
  siteUrlInput: string,
  credentials: string,
  mediaUrl: string
): Promise<{ success: boolean; mediaId?: number; sourceUrl?: string; error?: string }> {
  const siteUrl = normalizeSiteUrl(siteUrlInput);

  if (
    siteUrl.includes('test') ||
    siteUrl.includes('example.com') ||
    credentials.includes('TEST_')
  ) {
    return {
      success: true,
      mediaId: Math.floor(Math.random() * 1000) + 100,
      sourceUrl: mediaUrl,
    };
  }

  try {
    const authHeader = getBasicAuthHeader(credentials);

    // Resolve local file or remote buffer
    let fileBuffer: Buffer;
    let fileName = 'post-media.jpg';
    let mimeType = 'image/jpeg';

    if (mediaUrl.startsWith('/uploads/')) {
      const localPath = path.join(process.cwd(), 'public', mediaUrl);
      if (!fs.existsSync(localPath)) {
        return { success: false, error: 'Local media file not found' };
      }
      fileBuffer = fs.readFileSync(localPath);
      fileName = path.basename(localPath);
      if (fileName.endsWith('.png')) mimeType = 'image/png';
      else if (fileName.endsWith('.webp')) mimeType = 'image/webp';
      else if (fileName.endsWith('.gif')) mimeType = 'image/gif';
    } else {
      const res = await fetch(mediaUrl);
      if (!res.ok) {
        return { success: false, error: `Failed to download media for upload: HTTP ${res.status}` };
      }
      const arrayBuffer = await res.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      const urlPath = new URL(mediaUrl).pathname;
      if (urlPath) fileName = path.basename(urlPath) || 'media.jpg';
      const contentType = res.headers.get('content-type');
      if (contentType) mimeType = contentType;
    }

    const uploadRes = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
      body: fileBuffer as unknown as BodyInit,
    });

    const data = await uploadRes.json();
    if (!uploadRes.ok || !data.id) {
      return {
        success: false,
        error: data.message || `Media upload failed (HTTP ${uploadRes.status})`,
      };
    }

    return {
      success: true,
      mediaId: Number(data.id),
      sourceUrl: data.source_url || mediaUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Media upload exception: ${err?.message || 'Network error'}`,
    };
  }
}

/**
 * Publish or Schedule an Article/Post to WordPress
 */
export async function publishWordPressPost(params: PublishWordPressPostParams): Promise<{
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}> {
  const {
    siteUrl: rawSiteUrl,
    credentials,
    title,
    content,
    status = 'publish',
    scheduledAt,
    categories = [],
    tags = [],
    mediaUrl,
    excerpt,
  } = params;

  const siteUrl = normalizeSiteUrl(rawSiteUrl);

  // 1. Simulated Demo Handling
  if (
    siteUrl.includes('test') ||
    siteUrl.includes('example.com') ||
    credentials.includes('TEST_')
  ) {
    const mockId = String(Math.floor(Date.now() / 1000));
    const slug = (title || 'post')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return {
      success: true,
      postId: mockId,
      postUrl: `${siteUrl}/${new Date().getFullYear()}/${slug || mockId}/`,
    };
  }

  try {
    const authHeader = getBasicAuthHeader(credentials);

    // Optional: Upload Featured Image if mediaUrl provided
    let featuredMediaId: number | undefined;
    if (mediaUrl) {
      const uploadRes = await uploadWordPressMedia(siteUrl, credentials, mediaUrl);
      if (uploadRes.success && uploadRes.mediaId) {
        featuredMediaId = uploadRes.mediaId;
      }
    }

    // Determine status & date
    let effectiveStatus: string = status || 'publish';
    let postDate: string | undefined;

    if (scheduledAt) {
      if (status === 'draft' || status === 'private') {
        effectiveStatus = status;
      } else {
        effectiveStatus = 'future';
      }
      postDate = new Date(scheduledAt).toISOString();
    }

    // Convert category values to integer IDs
    const categoryIds = categories
      .map((c) => (typeof c === 'number' ? c : parseInt(String(c), 10)))
      .filter((c) => !isNaN(c) && c > 0);

    const postPayload: Record<string, any> = {
      title: title || 'Untitled Post',
      content: content || '',
      status: effectiveStatus,
    };

    if (postDate) {
      postPayload.date = postDate;
    }

    if (categoryIds.length > 0) {
      postPayload.categories = categoryIds;
    }

    if (excerpt && excerpt.trim()) {
      postPayload.excerpt = excerpt.trim();
    }

    if (featuredMediaId) {
      postPayload.featured_media = featuredMediaId;
    }

    const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(postPayload),
    });

    const data = await res.json();

    if (!res.ok || !data.id) {
      const errMsg =
        data.message ||
        data.error ||
        `WordPress API error (HTTP ${res.status}): Failed to publish post.`;
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      postId: String(data.id),
      postUrl: data.link || `${siteUrl}/?p=${data.id}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error connecting to WordPress API: ${err?.message || 'Unknown error'}`,
    };
  }
}

/**
 * Publish a Comment to a WordPress Post
 */
export async function publishWordPressComment(params: PublishWordPressCommentParams): Promise<{
  success: boolean;
  commentId?: string;
  error?: string;
}> {
  const { siteUrl: rawSiteUrl, credentials, postId, content } = params;
  const siteUrl = normalizeSiteUrl(rawSiteUrl);

  if (
    siteUrl.includes('test') ||
    siteUrl.includes('example.com') ||
    credentials.includes('TEST_')
  ) {
    return {
      success: true,
      commentId: `wp_comment_${Date.now()}`,
    };
  }

  try {
    const authHeader = getBasicAuthHeader(credentials);
    const numericPostId = parseInt(String(postId), 10);

    if (isNaN(numericPostId)) {
      return { success: false, error: 'Invalid numeric WordPress post ID for comment' };
    }

    const res = await fetch(`${siteUrl}/wp-json/wp/v2/comments`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        post: numericPostId,
        content: content.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.id) {
      return {
        success: false,
        error: data.message || `Failed to submit WordPress comment (HTTP ${res.status})`,
      };
    }

    return {
      success: true,
      commentId: String(data.id),
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error submitting comment: ${err?.message || 'Unknown error'}`,
    };
  }
}
