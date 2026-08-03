import { NextRequest, NextResponse } from 'next/server';
import { exportJobManager } from '@/lib/export-job-manager';

export async function GET(request: NextRequest) {
  try {
    const allJobs = exportJobManager.getAllJobs();
    return NextResponse.json({
      count: allJobs.length,
      jobs: allJobs.map(job => ({
        jobId: job.jobId,
        status: job.status,
        processed: job.processed,
        total: job.total,
        percentage: job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      })),
    });
  } catch (error: any) {
    console.error('Failed to get debug jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get debug jobs' },
      { status: 500 }
    );
  }
}