import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportJobManager } from '@/lib/export-job-manager';
import { calculateDynamicBatchSize } from '@/lib/export-batching';
import * as XLSX from 'xlsx';
import path from 'path';
import { writeFile, unlink } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order') || 'asc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.created_at.lte = new Date(dateTo);
      }
    }

    // Validate sortBy against whitelist to prevent SQL injection
    const validSortColumns = ['id', 'created_at', 'updated_at'];
    const sortColumn = (sortBy && validSortColumns.includes(sortBy)) ? sortBy : 'id';
    const sortDirection = (order === 'asc' ? 'ASC' : 'DESC');

    // Build WHERE clause for reuse with proper parameterization
    const conditions: string[] = [];
    const params: any[] = [];

    const processCondition = (key: string, value: any) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const [op, val] = Object.entries(value)[0];
        const sqlOp = {
          gte: '>=',
          lte: '<=',
          gt: '>',
          lt: '<',
        }[op] || '=';
        conditions.push(`${key} ${sqlOp} ?`);
        params.push(val);
      } else if (Array.isArray(value)) {
        conditions.push(`${key} IN (${value.map(() => '?').join(',')})`);
        params.push(...value);
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    };

    Object.entries(where).forEach(([key, value]) => {
      if (key === 'OR') {
        const orConditions: string[] = [];
        (value as any[]).forEach((cond: any) => {
          const [field, op] = Object.entries(cond)[0];
          const fieldValue = Object.values(cond)[0];
          if (op === 'contains') {
            orConditions.push(`${field} LIKE ?`);
            params.push(`%${fieldValue}%`);
          } else {
            orConditions.push(`${field} = ?`);
            params.push(fieldValue);
          }
        });
        conditions.push(`(${orConditions.join(' OR ')})`);
      } else {
        processCondition(key, value);
      }
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    let total: number;
    const hasFilters = Object.keys(where).length > 0;
    
    if (hasFilters) {
      const countResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total FROM redeem_benefit ${whereClause}`,
        ...params
      ) as any[];
      total = Number(countResult[0]?.total || 0);
    } else {
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as total FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'redeem_benefit'`
      ) as any[];
      total = Number(approxResult[0]?.total || 0);
    }

    // Create job
    const jobId = exportJobManager.createJob(total);

    // Start the export process asynchronously (don't await)
    runExportJob(jobId, whereClause, params, sortColumn, sortDirection, total).catch(error => {
      console.error(`Export job ${jobId} failed:`, error);
      exportJobManager.failJob(jobId, error.message);
    });

    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error('Failed to start export job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start export job' },
      { status: 500 }
    );
  }
}

async function runExportJob(
  jobId: string,
  whereClause: string,
  params: any[],
  sortColumn: string,
  sortDirection: string,
  total: number
) {
  const { batchSize } = calculateDynamicBatchSize(total);
  
  let redeemBenefits: any[] = [];
  let offset = 0;
  let hasMore = true;
  let processed = 0;

  try {
    // Batch fetching loop
    while (hasMore) {
      // Check if job was cancelled - check both cancelled flag and status for robustness
      const currentJob = exportJobManager.getJob(jobId);
      if (currentJob?.status === 'cancelled' || exportJobManager.isCancelled(jobId)) {
        // Clean up partial file if it exists
        try {
          const date = new Date().toISOString().split('T')[0];
          const filename = `redeem-benefit-${date}-${jobId}.xlsx`;
          const filePath = path.join(process.cwd(), 'temp', filename);
          if (existsSync(filePath)) {
            await unlink(filePath);
          }
        } catch (cleanupError) {
          console.error(`Failed to clean up partial file on cancellation:`, cleanupError);
        }
        
        return;
      }

      const batch = await prisma.$queryRawUnsafe(
        `SELECT
          id, user_id, merchant_id, name, email, status,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM redeem_benefit
        ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}
        LIMIT ${offset}, ${batchSize}`,
        ...params
      ) as any[];
      
      redeemBenefits.push(...batch);
      processed += batch.length;
      
      // Update progress
      exportJobManager.updateProgress(jobId, processed);
      console.log(`Export job ${jobId}: batch ${Math.ceil(processed / batchSize)} complete, processed ${processed}/${total} (${Math.round((processed / total) * 100)}%)`);
      
      offset += batchSize;
      hasMore = batch.length === batchSize;
    }

    // Generate Excel file
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'user_id', label: 'User ID' },
      { key: 'merchant_id', label: 'Merchant ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created At' },
      { key: 'updated_at', label: 'Updated At' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(
      redeemBenefits.map(row => {
        const mappedRow: Record<string, any> = {};
        columns.forEach(col => {
          mappedRow[col.label] = row[col.key] ?? '';
        });
        return mappedRow;
      }),
      { header: columns.map(c => c.label) }
    );

    // Style the header row
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: "E5262C" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center" }
        };
      }
    }

    // Calculate column widths
    const colWidths = columns.map(col => {
      const headerWidth = col.label.length;
      const maxWidth = redeemBenefits.reduce((max, row) => {
        const value = String(row[col.key] ?? '');
        return Math.max(max, value.length);
      }, headerWidth);
      return Math.min(Math.max(maxWidth + 2, 10), 50);
    });

    worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Write to temporary file
    const date = new Date().toISOString().split('T')[0];
    const filename = `redeem-benefit-${date}-${jobId}.xlsx`;
    const filePath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Generate buffer and write with Node.js fs to avoid XLSX bundler detection issues
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buffer);

    // Mark job as completed
    exportJobManager.completeJob(jobId, filename);
  } catch (error: any) {
    console.error(`Export job ${jobId} failed:`, error);
    exportJobManager.failJob(jobId, error.message);
    
    // Clean up partial file if it exists
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `redeem-benefit-${date}-${jobId}.xlsx`;
      const filePath = path.join(process.cwd(), 'temp', filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (cleanupError) {
      console.error(`Failed to clean up partial file:`, cleanupError);
    }
  }
}
