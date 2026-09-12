/**
 * Social Media OAuth 2.0 Integration & Automated Account Discovery
 * Supports Meta (Facebook & Instagram) and LinkedIn OAuth 2.0 Flows
 */

export interface OAuthConfig {
  facebook: {
    appId: string;
    appSecret: string;
  };
  linkedin: {
    clientId: string;
    clientSecret: string;
  };
}

export function getOAuthConfig(): OAuthConfig {
  return {
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_CLIENT_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET || '',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    },
  };
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

/**
 * 1. Facebook & Instagram OAuth URL Generator
 */
export function getFacebookAuthUrl(state: string, isInstagram: boolean = false): string {
  const config = getOAuthConfig().facebook;
  const redirectUri = `${getAppBaseUrl()}/api/oauth/facebook/callback`;

  // Comprehensive permissions for Facebook Pages, Posts, and Instagram Professional
  const scopes = [
    'email',
    'public_profile',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_manage_engagement',
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
  ].join(',');

  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: redirectUri,
    state: `${state}_${isInstagram ? 'ig' : 'fb'}`,
    scope: scopes,
    response_type: 'code',
    auth_type: 'rerequest',
  });

  return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
}

/**
 * 2. LinkedIn OAuth URL Generator
 */
export function getLinkedInAuthUrl(state: string): string {
  const config = getOAuthConfig().linkedin;
  const redirectUri = `${getAppBaseUrl()}/api/oauth/linkedin/callback`;

  // Standard OpenID and UGC publishing scopes
  const scopes = ['openid', 'profile', 'email', 'w_member_social'].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: scopes,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * 3. Exchange Facebook OAuth Code for Long-Lived Access Token & Discover Pages
 */
export async function handleFacebookOAuthCallback(code: string): Promise<{
  success: boolean;
  pages: Array<{
    id: string;
    name: string;
    avatar?: string;
    category?: string;
    accessToken: string;
    platform: 'FACEBOOK';
  }>;
  instagramAccounts: Array<{
    id: string;
    name: string;
    avatar?: string;
    category?: string;
    accessToken: string;
    platform: 'INSTAGRAM';
  }>;
  error?: string;
}> {
  const config = getOAuthConfig().facebook;
  const redirectUri = `${getAppBaseUrl()}/api/oauth/facebook/callback`;

  try {
    // A. Exchange code for short-lived user token
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${config.appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${config.appSecret}&code=${code}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      return {
        success: false,
        pages: [],
        instagramAccounts: [],
        error: tokenData.error?.message || 'Failed to obtain Facebook access token',
      };
    }

    const shortLivedToken = tokenData.access_token;

    // B. Exchange for long-lived token (60 days)
    const longLivedUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${config.appId}&client_secret=${config.appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    const userToken = longLivedData.access_token || shortLivedToken;

    // C. Fetch all Facebook Pages managed by user (with permanent Page Access Tokens)
    const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,category,picture{url},access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${userToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || pagesData.error) {
      return {
        success: false,
        pages: [],
        instagramAccounts: [],
        error: pagesData.error?.message || 'Failed to fetch Facebook Pages',
      };
    }

    const rawPages = pagesData.data || [];
    const discoveredPages: any[] = [];
    const discoveredInstagram: any[] = [];

    for (const p of rawPages) {
      discoveredPages.push({
        id: p.id,
        name: p.name,
        avatar: p.picture?.data?.url || null,
        category: p.category || 'Facebook Page',
        accessToken: p.access_token, // Permanent page token!
        platform: 'FACEBOOK',
      });

      // If page has a connected Instagram Business/Creator account
      if (p.instagram_business_account) {
        const ig = p.instagram_business_account;
        discoveredInstagram.push({
          id: ig.id,
          name: `@${(ig.username || p.name).replace(/^@/, '')}`,
          avatar: ig.profile_picture_url || p.picture?.data?.url || null,
          category: 'Instagram Business',
          accessToken: p.access_token, // Uses page access token to publish to linked IG
          platform: 'INSTAGRAM',
        });
      }
    }

    // Also fetch user profile if no pages were found
    if (discoveredPages.length === 0) {
      const meUrl = `https://graph.facebook.com/v20.0/me?fields=id,name,picture{url}&access_token=${userToken}`;
      const meRes = await fetch(meUrl);
      const meData = await meRes.json();
      if (meData && meData.id) {
        discoveredPages.push({
          id: meData.id,
          name: `${meData.name} (Profile)`,
          avatar: meData.picture?.data?.url || null,
          category: 'Personal Profile',
          accessToken: userToken,
          platform: 'FACEBOOK',
        });
      }
    }

    return {
      success: true,
      pages: discoveredPages,
      instagramAccounts: discoveredInstagram,
    };
  } catch (err: any) {
    return {
      success: false,
      pages: [],
      instagramAccounts: [],
      error: err?.message || 'Network error connecting to Facebook OAuth',
    };
  }
}

/**
 * 4. Exchange LinkedIn OAuth Code for Access Token & Discover Profile
 */
export async function handleLinkedInOAuthCallback(code: string): Promise<{
  success: boolean;
  account?: {
    id: string;
    name: string;
    avatar?: string | null;
    category: string;
    accessToken: string;
    platform: 'LINKEDIN';
  };
  error?: string;
}> {
  const config = getOAuthConfig().linkedin;
  const redirectUri = `${getAppBaseUrl()}/api/oauth/linkedin/callback`;

  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      return {
        success: false,
        error: tokenData.error_description || tokenData.error || 'Failed to exchange LinkedIn code',
      };
    }

    const accessToken = tokenData.access_token;

    // Fetch User Profile using OpenID UserInfo
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userRes.json();

    if (!userRes.ok || userData.error) {
      return {
        success: false,
        error: userData.error_description || 'Failed to fetch LinkedIn profile details',
      };
    }

    const personUrn = userData.sub ? `urn:li:person:${userData.sub}` : `urn:li:person:me`;
    const name = userData.name || `${userData.given_name || ''} ${userData.family_name || ''}`.trim() || 'LinkedIn Member';

    return {
      success: true,
      account: {
        id: personUrn,
        name: name,
        avatar: userData.picture || null,
        category: 'LinkedIn Personal Profile',
        accessToken: accessToken,
        platform: 'LINKEDIN',
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error connecting to LinkedIn OAuth',
    };
  }
}
