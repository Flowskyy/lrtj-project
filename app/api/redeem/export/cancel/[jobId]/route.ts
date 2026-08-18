import { NextRequest, NextResponse } from 'next/server';
import { exportJobManager } from '@/lib/export-job-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = exportJobManager.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'running') {
      return NextResponse.json(
        { error: 'Job is not running' },
        { status: 400 }
      );
    }

    await exportJobManager.cancelJob(jobId);

    return NextResponse.json({
      message: 'Job cancelled successfully',
      jobId,
    });
  } catch (error: any) {
    console.error('Failed to cancel job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel job' },
      { status: 500 }
    );
  }
}