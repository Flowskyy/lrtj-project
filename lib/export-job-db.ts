import { PrismaClient } from './generated/prisma'
import { getWIBDate } from './utils'

const prisma = new PrismaClient()

export interface ExportJobDB {
  id: bigint
  job_id: string
  job_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  total_rows: number
  processed_rows: number
  successful_rows: number
  triggered_by_user_id: number | null
  filters: any
  result_file_path: string | null
  error_message: string | null
  created_at: Date | null
  started_at: Date | null
  completed_at: Date | null
  updated_at: Date | null
}

/**
 * Create a new export job record in cms_export_jobs table
 */
export async function createExportJobDB(params: {
  jobId: string
  jobType: string
  totalRows: number
  triggeredByUserId?: number
  filters?: any
}): Promise<void> {
  const now = getWIBDate()
  
  await prisma.cms_export_jobs.create({
    data: {
      job_id: params.jobId,
      job_type: params.jobType,
      status: 'pending',
      total_rows: params.totalRows,
      processed_rows: 0,
      successful_rows: 0,
      triggered_by_user_id: params.triggeredByUserId || null,
      filters: params.filters || null,
      result_file_path: null,
      error_message: null,
      created_at: now,
      started_at: null,
      completed_at: null,
      updated_at: now,
    },
  })
}

/**
 * Update export job status to processing
 */
export async function startExportJobDB(jobId: string): Promise<void> {
  const now = getWIBDate()
  
  await prisma.cms_export_jobs.update({
    where: { job_id: jobId },
    data: {
      status: 'processing',
      started_at: now,
      updated_at: now,
    },
  })
}

/**
 * Update export job progress
 */
export async function updateExportJobProgressDB(jobId: string, processedRows: number, successfulRows: number = 0): Promise<void> {
  const now = getWIBDate()
  
  await prisma.cms_export_jobs.update({
    where: { job_id: jobId },
    data: {
      processed_rows: processedRows,
      successful_rows: successfulRows,
      updated_at: now,
    },
  })
}

/**
 * Mark export job as completed
 */
export async function completeExportJobDB(jobId: string, resultFilePath: string, successfulRows: number): Promise<void> {
  const now = getWIBDate()
  
  await prisma.cms_export_jobs.update({
    where: { job_id: jobId },
    data: {
      status: 'completed',
      result_file_path: resultFilePath,
      successful_rows: successfulRows,
      completed_at: now,
      updated_at: now,
    },
  })
}

/**
 * Mark export job as failed
 */
export async function failExportJobDB(jobId: string, errorMessage: string, processedRows: number = 0, successfulRows: number = 0): Promise<void> {
  const now = getWIBDate()
  
  await prisma.cms_export_jobs.update({
    where: { job_id: jobId },
    data: {
      status: 'failed',
      error_message: errorMessage,
      processed_rows: processedRows,
      successful_rows: successfulRows,
      completed_at: now,
      updated_at: now,
    },
  })
}

/**
 * Mark export job as cancelled
 */
export async function cancelExportJobDB(jobId: string, processedRows: number = 0, successfulRows: number = 0): Promise<void> {
  const now = getWIBDate()
  
  await prisma.cms_export_jobs.update({
    where: { job_id: jobId },
    data: {
      status: 'cancelled',
      processed_rows: processedRows,
      successful_rows: successfulRows,
      completed_at: now,
      updated_at: now,
    },
  })
}

/**
 * Get export job by job_id
 */
export async function getExportJobDB(jobId: string): Promise<ExportJobDB | null> {
  return await prisma.cms_export_jobs.findUnique({
    where: { job_id: jobId },
  }) as ExportJobDB | null
}

/**
 * Get all export jobs for a user
 */
export async function getExportJobsByUserDB(userId: number): Promise<ExportJobDB[]> {
  return await prisma.cms_export_jobs.findMany({
    where: { triggered_by_user_id: userId },
    orderBy: { created_at: 'desc' },
  }) as ExportJobDB[]
}

/**
 * Delete an export job from DB (called after successful download)
 */
export async function deleteExportJobDB(jobId: string): Promise<void> {
  await prisma.cms_export_jobs.delete({
    where: { job_id: jobId },
  })
}
