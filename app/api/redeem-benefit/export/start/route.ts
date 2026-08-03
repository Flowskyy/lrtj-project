import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportJobManager } from '@/lib/export-job-manager';
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

    const orderBy: any = {};
    if (sortBy === 'id') {
      orderBy.id = order;
    } else if (sortBy === 'created_at') {
      orderBy.created_at = order;
    } else if (sortBy === 'updated_at') {
      orderBy.updated_at = order;
    } else {
      orderBy.id = 'desc';
    }

    // Build WHERE clause for reuse
    const whereClause = Object.keys(where).length > 0 ?
      'WHERE ' + Object.entries(where).map(([key, value]) => {
        if (key === 'OR') {
          const orConditions = (value as any[]).map((cond: any) => {
            const [field, op] = Object.entries(cond)[0];
            const fieldValue = Object.values(cond)[0];
            if (op === 'contains') return `${field} LIKE '%${fieldValue}%'`;
            return `${field} = ${fieldValue}`;
          }).join(' OR ');
          return `(${orConditions})`;
        }
        if (typeof value === 'object' && value !== null) {
          const [op, val] = Object.entries(value)[0];
          return `${key} ${op.toUpperCase()} ${val}`;
        }
        return `${key} = ${value}`;
      }).join(' AND ') : '';

    // Get total count
    let total: number;
    const hasFilters = Object.keys(where).length > 0;
    
    if (hasFilters) {
      const countResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total FROM redeem_benefit ${whereClause}`
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
    runExportJob(jobId, whereClause, orderBy, total).catch(error => {
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
  orderBy: any,
  total: number
) {
  const batchSize = 50000;
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
        console.log(`Export job ${jobId} cancelled, stopping batch loop`);
        
        // Clean up partial file if it exists
        try {
          const date = new Date().toISOString().split('T')[0];
          const filename = `redeem-benefit-${date}-${jobId}.xlsx`;
          const filePath = path.join(process.cwd(), 'temp', filename);
          if (existsSync(filePath)) {
            await unlink(filePath);
            console.log(`Cleaned up partial file on cancellation: ${filename}`);
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
        ${Object.keys(orderBy).length > 0 ? `ORDER BY ${Object.keys(orderBy)[0]} ${(Object.values(orderBy)[0] as string).toUpperCase()}` : 'ORDER BY id DESC'}
        LIMIT ${offset}, ${batchSize}`
      ) as any[];
      
      redeemBenefits.push(...batch);
      processed += batch.length;
      
      // Update progress
      exportJobManager.updateProgress(jobId, processed);
      
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
    
    console.log(`Export job ${jobId} completed successfully`);
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
        console.log(`Cleaned up partial file: ${filename}`);
      }
    } catch (cleanupError) {
      console.error(`Failed to clean up partial file:`, cleanupError);
    }
  }
}
