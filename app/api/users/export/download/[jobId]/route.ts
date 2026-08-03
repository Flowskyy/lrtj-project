import { NextRequest, NextResponse } from 'next/server';
import { exportJobManager } from '@/lib/export-job-manager';
import path from 'path';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

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

    if (job.status !== 'completed' || !job.filePath) {
      return NextResponse.json(
        { error: 'Job is not completed or file not available' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'temp', job.filePath);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);

    // Clean up the file and job after successful read
    try {
      await unlink(filePath);
      exportJobManager.deleteJob(jobId);
    } catch (cleanupError) {
      console.error('Failed to cleanup file/job:', cleanupError);
      // Don't fail the request if cleanup fails
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
