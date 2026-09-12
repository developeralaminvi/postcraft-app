import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOAuthConfig, getAppBaseUrl } from '@/lib/oauth';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getOAuthConfig();

    return NextResponse.json({
      facebookConfigured: !!(config.facebook.appId && config.facebook.appSecret),
      facebookAppId: config.facebook.appId || '',
      linkedinConfigured: !!(config.linkedin.clientId && config.linkedin.clientSecret),
      linkedinClientId: config.linkedin.clientId || '',
      baseUrl: getAppBaseUrl(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      facebookAppId,
      facebookAppSecret,
      linkedinClientId,
      linkedinClientSecret,
    } = await req.json();

    // Update process.env in runtime
    if (facebookAppId !== undefined) process.env.FACEBOOK_APP_ID = facebookAppId.trim();
    if (facebookAppSecret !== undefined) process.env.FACEBOOK_APP_SECRET = facebookAppSecret.trim();
    if (linkedinClientId !== undefined) process.env.LINKEDIN_CLIENT_ID = linkedinClientId.trim();
    if (linkedinClientSecret !== undefined) process.env.LINKEDIN_CLIENT_SECRET = linkedinClientSecret.trim();

    // Persist to .env file if writable
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf-8');

        const updateEnvVar = (key: string, val: string) => {
          if (!val) return;
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}="${val}"`);
          } else {
            envContent += `\n${key}="${val}"`;
          }
        };

        if (facebookAppId) updateEnvVar('FACEBOOK_APP_ID', facebookAppId.trim());
        if (facebookAppSecret) updateEnvVar('FACEBOOK_APP_SECRET', facebookAppSecret.trim());
        if (linkedinClientId) updateEnvVar('LINKEDIN_CLIENT_ID', linkedinClientId.trim());
        if (linkedinClientSecret) updateEnvVar('LINKEDIN_CLIENT_SECRET', linkedinClientSecret.trim());

        fs.writeFileSync(envPath, envContent, 'utf-8');
      }
    } catch (fsErr) {
      console.warn('Could not persist to .env file directly, updated in-memory runtime:', fsErr);
    }

    return NextResponse.json({
      success: true,
      message: 'OAuth API credentials updated successfully!',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
