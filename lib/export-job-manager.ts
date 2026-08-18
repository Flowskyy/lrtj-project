// In-memory job store for export operations with DB persistence
// Note: This is a single-instance solution. For multi-instance deployments,
// consider using Redis or another persistent store for job state sharing.

import {
  createExportJobDB,
  startExportJobDB,
  updateExportJobProgressDB,
  completeExportJobDB,
  failExportJobDB,
  cancelExportJobDB,
} from './export-job-db'
import { readdir, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export interface ExportJob {
  jobId: string;
  status: 'running' | 'completed' | 'cancelled' | 'error';
  processed: number;
  total: number;
  filePath: string | null;
  error: string | null;
  cancelled: boolean;
  createdAt: number;
  completedAt: number | null;
  jobType?: string;
  triggeredByUserId?: number;
  filters?: any;
}

class ExportJobManager {
  private jobs: Map<string, ExportJob> = new Map();
  private readonly JOB_TTL = 3600000; // 1 hour in milliseconds

  // Generate a unique job ID
  generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Create a new job
  async createJob(total: number, jobType?: string, triggeredByUserId?: number, filters?: any): Promise<string> {
    const jobId = this.generateJobId();
    const job: ExportJob = {
      jobId,
      status: 'running',
      processed: 0,
      total,
      filePath: null,
      error: null,
      cancelled: false,
      createdAt: Date.now(),
      completedAt: null,
      jobType,
      triggeredByUserId,
      filters,
    };
    this.jobs.set(jobId, job);
    
    // Persist to DB
    try {
      await createExportJobDB({
        jobId,
        jobType: jobType || 'unknown',
        totalRows: total,
        triggeredByUserId,
        filters,
      });
    } catch (error) {
      console.error(`Failed to persist job ${jobId} to DB:`, error);
      // Continue anyway - in-memory tracking still works
    }
    
    return jobId;
  }

  // Get a job by ID
  getJob(jobId: string): ExportJob | null {
    return this.jobs.get(jobId) || null;
  }

  // Update job progress
  async updateProgress(jobId: string, processed: number, successfulRows: number = 0): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.processed = processed;
      
      // Persist to DB
      try {
        await updateExportJobProgressDB(jobId, processed, successfulRows);
      } catch (error) {
        console.error(`Failed to update progress for job ${jobId} in DB:`, error);
      }
    }
  }

  // Mark job as completed
  async completeJob(jobId: string, filePath: string, successfulRows: number = 0): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.filePath = filePath;
      job.completedAt = Date.now();
      
      // Persist to DB
      try {
        await completeExportJobDB(jobId, filePath, successfulRows || job.processed);
      } catch (error) {
        console.error(`Failed to mark job ${jobId} as completed in DB:`, error);
      }
    }
  }

  // Mark job as cancelled
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.cancelled = true;
      job.status = 'cancelled';
      job.completedAt = Date.now();
      
      // Persist to DB
      try {
        await cancelExportJobDB(jobId, job.processed, job.processed);
      } catch (error) {
        console.error(`Failed to mark job ${jobId} as cancelled in DB:`, error);
      }
    }
  }

  // Mark job as failed
  async failJob(jobId: string, error: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'error';
      job.error = error;
      job.completedAt = Date.now();
      
      // Persist to DB
      try {
        await failExportJobDB(jobId, error, job.processed, job.processed);
      } catch (error) {
        console.error(`Failed to mark job ${jobId} as failed in DB:`, error);
      }
    }
  }

  // Check if job is cancelled
  isCancelled(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    return job ? job.cancelled : false;
  }

  // Clean up old jobs (called periodically)
  cleanupOldJobs(): void {
    const now = Date.now();
    for (const [jobId, job] of this.jobs.entries()) {
      if (now - job.createdAt > this.JOB_TTL) {
        this.jobs.delete(jobId);
      }
    }
  }

  // Clean up old export files from temp directory
  async cleanupOldFiles(): Promise<void> {
    try {
      const tempDir = path.join(process.cwd(), 'temp')
      if (!existsSync(tempDir)) {
        return
      }

      const files = await readdir(tempDir)
      const now = Date.now()
      const FILE_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

      for (const file of files) {
        const filePath = path.join(tempDir, file)
        try {
          const stats = await stat(filePath)
          const fileAge = now - stats.mtimeMs

          if (fileAge > FILE_TTL) {
            await unlink(filePath)
            console.log(`Cleaned up old export file: ${file}`)
          }
        } catch (error) {
          console.error(`Failed to check/cleanup file ${file}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old export files:', error)
    }
  }

  // Delete a specific job
  deleteJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  // Get all jobs (for debugging)
  getAllJobs(): ExportJob[] {
    return Array.from(this.jobs.values());
  }
}

// Singleton instance with globalThis to survive Next.js hot-reloads
const globalForExportJobManager = globalThis as unknown as {
  exportJobManager: ExportJobManager | undefined
  exportJobCleanupInitialized: boolean | undefined
}

export const exportJobManager = globalForExportJobManager.exportJobManager ?? new ExportJobManager()

if (process.env.NODE_ENV !== 'production') {
  globalForExportJobManager.exportJobManager = exportJobManager
}

// Periodic cleanup every 5 minutes - only register once per process and only in runtime
if (typeof setInterval !== 'undefined' && 
    !globalForExportJobManager.exportJobCleanupInitialized) {
  globalForExportJobManager.exportJobCleanupInitialized = true
  setInterval(() => {
    exportJobManager.cleanupOldJobs();
    // cleanupOldFiles() temporarily disabled due to globalThis singleton cache issue
    // Will be re-enabled once the singleton is properly refreshed
  }, 300000);
}
