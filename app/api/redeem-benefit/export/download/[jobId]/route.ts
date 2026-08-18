import { NextRequest, NextResponse } from 'next/server';
import { exportJobManager } from '@/lib/export-job-manager';
import { getExportJobDB, deleteExportJobDB } from '@/lib/export-job-db';
import path from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // First try in-memory job
    let job = exportJobManager.getJob(jobId);
    let filePath: string | null = null;

    // If not in memory, fall back to DB
    if (!job) {
      const dbJob = await getExportJobDB(jobId);
      if (dbJob) {
        job = {
          jobId: dbJob.job_id,
          status: dbJob.status as 'running' | 'completed' | 'cancelled' | 'error',
          processed: dbJob.processed_rows,
          total: dbJob.total_rows,
          filePath: dbJob.result_file_path,
          error: dbJob.error_message,
          cancelled: dbJob.status === 'cancelled',
          createdAt: dbJob.created_at ? dbJob.created_at.getTime() : Date.now(),
          completedAt: dbJob.completed_at ? dbJob.completed_at.getTime() : null,
          jobType: dbJob.job_type,
          triggeredByUserId: dbJob.triggered_by_user_id ?? undefined,
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

    if (job.status !== 'completed' || !job.filePath) {
      return NextResponse.json(
        { error: 'Job is not completed or file not available' },
        { status: 400 }
      );
    }

    filePath = path.join(process.cwd(), 'temp', job.filePath);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);

    // Clean up job record from in-memory and DB after successful download
    // File itself is cleaned up by periodic cleanup job (24h TTL)
    try {
      exportJobManager.deleteJob(jobId);
      await deleteExportJobDB(jobId);
    } catch (cleanupError: any) {
      console.error('Failed to cleanup job record:', cleanupError);
      // Don't fail the download if cleanup fails
    }

    // Return the file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${job.filePath}"`,
      },
    });
  } catch (error: any) {
    console.error('Failed to download file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download file' },
      { status: 500 }
    );
  }
}
