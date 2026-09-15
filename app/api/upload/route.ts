import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mimeType = file.type.toLowerCase();
    let mediaType: 'IMAGE' | 'VIDEO' = 'IMAGE';

    if (mimeType.startsWith('video/')) {
      mediaType = 'VIDEO';
    } else if (!mimeType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image (JPG, PNG, GIF, WEBP) and video (MP4, MOV, WEBM) files are supported.' },
        { status: 400 }
      );
    }

    // Limit file size (50MB for video, 15MB for image)
    const maxBytes = mediaType === 'VIDEO' ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File is too large. Max size is ${mediaType === 'VIDEO' ? '50MB' : '15MB'}` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || (mediaType === 'VIDEO' ? '.mp4' : '.jpg');
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    let publicUrl = '';
    let savedToDisk = false;

    // Strategy 1: Save to public/uploads (works on local dev and standard servers)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fsSync.existsSync(uploadDir)) {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, safeName);
      await fs.writeFile(filePath, buffer);
      publicUrl = `/uploads/${safeName}`;
      savedToDisk = true;
    } catch (diskErr: any) {
      console.warn('Could not write to public/uploads (likely serverless):', diskErr?.message);
    }

    // Strategy 2: If public/uploads failed, try os.tmpdir()/postcraft_uploads
    if (!savedToDisk) {
      try {
        const tmpUploadDir = path.join(os.tmpdir(), 'postcraft_uploads');
        if (!fsSync.existsSync(tmpUploadDir)) {
          await fs.mkdir(tmpUploadDir, { recursive: true });
        }
        const filePath = path.join(tmpUploadDir, safeName);
        await fs.writeFile(filePath, buffer);
        publicUrl = `/uploads/${safeName}`;
        savedToDisk = true;
      } catch (tmpErr: any) {
        console.warn('Could not write to os.tmpdir():', tmpErr?.message);
      }
    }

    // Strategy 3: Universal fallback: If saving to disk failed or running on Vercel with image, provide Data URL
    if (!savedToDisk || (process.env.VERCEL && file.size < 4 * 1024 * 1024)) {
      publicUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      mediaType,
      size: file.size,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media file' },
      { status: 500 }
    );
  }
}