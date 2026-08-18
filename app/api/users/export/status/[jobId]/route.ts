import { NextRequest, NextResponse } from 'next/server';
import { exportJobManager } from '@/lib/export-job-manager';
import { getExportJobDB } from '@/lib/export-job-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    let job = exportJobManager.getJob(jobId);

    // Fallback to DB if job not in memory (e.g., after hot-reload)
    if (!job) {
      const dbJob = await getExportJobDB(jobId);
      if (dbJob) {
        // Map DB status to in-memory status
        const statusMap: Record<string, 'running' | 'completed' | 'cancelled' | 'error'> = {
          'pending': 'running',
          'processing': 'running',
          'completed': 'completed',
          'cancelled': 'cancelled',
          'failed': 'error',
        };
        
        job = {
          jobId: dbJob.job_id,
          status: statusMap[dbJob.status] || 'error',
          processed: dbJob.processed_rows,
          total: dbJob.total_rows,
          filePath: dbJob.result_file_path,
          error: dbJob.error_message,
          cancelled: dbJob.status === 'cancelled',
          createdAt: dbJob.created_at?.getTime() || Date.now(),
          completedAt: dbJob.completed_at?.getTime() || null,
          jobType: dbJob.job_type,
          triggeredByUserId: dbJob.triggered_by_user_id || undefined,
          filters: dbJob.filters,
        };
      }
    }

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
        ? `/api/users/export/download/${jobId}` 
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
