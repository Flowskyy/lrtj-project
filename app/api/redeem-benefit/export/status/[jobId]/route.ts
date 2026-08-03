import { NextRequest, NextResponse } from 'next/server';
import { exportJobManager } from '@/lib/export-job-manager';

export async function GET(
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

    const percentage = job.total > 0 
      ? Math.round((job.processed / job.total) * 100) 
      : 0;

    return NextResponse.json({
      status: job.status,
      processed: job.processed,
      total: job.total,
      percentage,
      downloadUrl: job.status === 'completed' && job.filePath 
        ? `/api/redeem-benefit/export/download/${jobId}` 
        : null,
      error: job.error,
    });
  } catch (error: any) {
    console.error('Failed to get job status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}
