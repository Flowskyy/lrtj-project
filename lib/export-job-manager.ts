// In-memory job store for export operations
// Note: This is a single-instance solution. For multi-instance deployments,
// consider using Redis or another persistent store for job state sharing.

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
}

class ExportJobManager {
  private jobs: Map<string, ExportJob> = new Map();
  private readonly JOB_TTL = 3600000; // 1 hour in milliseconds

  // Generate a unique job ID
  generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Create a new job
  createJob(total: number): string {
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
    };
    this.jobs.set(jobId, job);
    return jobId;
  }

  // Get a job by ID
  getJob(jobId: string): ExportJob | null {
    return this.jobs.get(jobId) || null;
  }

  // Update job progress
  updateProgress(jobId: string, processed: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.processed = processed;
    }
  }

  // Mark job as completed
  completeJob(jobId: string, filePath: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.filePath = filePath;
      job.completedAt = Date.now();
    }
  }

  // Mark job as cancelled
  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.cancelled = true;
      job.status = 'cancelled';
      job.completedAt = Date.now();
    }
  }

  // Mark job as failed
  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'error';
      job.error = error;
      job.completedAt = Date.now();
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
}

export const exportJobManager = globalForExportJobManager.exportJobManager ?? new ExportJobManager()

if (process.env.NODE_ENV !== 'production') {
  globalForExportJobManager.exportJobManager = exportJobManager
}

// Periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    exportJobManager.cleanupOldJobs();
  }, 300000);
}
