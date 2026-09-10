import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mimeType = file.type.toLowerCase();
    let mediaType = 'IMAGE';

    if (mimeType.startsWith('video/')) {
      mediaType = 'VIDEO';
    } else if (!mimeType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image (JPG, PNG, GIF, WEBP) and video (MP4, MOV, WEBM) files are supported.' },
        { status: 400 }
      );
    }

    // Limit file size (e.g. 50MB for video, 10MB for image)
    const maxBytes = mediaType === 'VIDEO' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File is too large. Max size is ${mediaType === 'VIDEO' ? '50MB' : '10MB'}` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || (mediaType === 'VIDEO' ? '.mp4' : '.jpg');
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;

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