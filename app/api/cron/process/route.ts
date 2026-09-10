import { NextResponse } from 'next/server';
import { processAllDueJobs } from '@/lib/scheduler';

export async function GET() {
  try {
    const results = await processAllDueJobs();
    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('Cron process error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process scheduled jobs' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const results = await processAllDueJobs();
    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('Cron process error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process scheduled jobs' },
      { status: 500 }
    );
  }
}
