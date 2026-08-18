import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportJobManager } from '@/lib/export-job-manager';
import { calculateDynamicBatchSize } from '@/lib/export-batching';
import { startExportJobDB } from '@/lib/export-job-db';
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
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const categoryId = searchParams.get('category_id');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (categoryId) {
      // Filter by merchandise category_id
      const matchingMerchandiseIds = await prisma.merchandise.findMany({
        where: {
          category_id: parseInt(categoryId),
        },
        select: {
          id: true,
        },
      });
      
      if (matchingMerchandiseIds.length > 0) {
        where.merchandise_id = {
          in: matchingMerchandiseIds.map(m => m.id),
        };
      } else {
        // No merchandise in this category, return empty results
        where.merchandise_id = -1;
      }
    }

    if (search && search.trim()) {
      const searchNum = parseInt(search.trim());
      const searchConditions: any[] = [];

      if (!isNaN(searchNum)) {
        searchConditions.push({ id: searchNum });
      }

      searchConditions.push({ receiver_name: { contains: search.trim() } });

      // For merchandise name search, we need to find matching merchandise IDs first
      const matchingMerchandise = await prisma.merchandise.findMany({
        where: {
          name: {
            contains: search.trim(),
          },
        },
        select: {
          id: true,
        },
        take: 100,
      });

      if (matchingMerchandise.length > 0) {
        searchConditions.push({
          merchandise_id: {
            in: matchingMerchandise.map(m => m.id),
          },
        });
      }

      where.OR = searchConditions;
    }

    const orderBy: any = {};
    if (sortBy === 'id') {
      orderBy.id = order;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = order;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = order;
    } else {
      orderBy.id = 'desc';
    }

    // Build WHERE clause for raw SQL
    const conditions: string[] = [];
    const params: any[] = [];

    if (where.status) {
      conditions.push('status = ?');
      params.push(where.status);
    }
    if (where.createdAt) {
      if (where.createdAt.gte) {
        conditions.push('created_at >= ?');
        params.push(where.createdAt.gte);
      }
      if (where.createdAt.lte) {
        conditions.push('created_at <= ?');
        params.push(where.createdAt.lte);
      }
    }
    if (where.merchandise_id) {
      if (Array.isArray(where.merchandise_id.in)) {
        conditions.push(`merchandise_id IN (${where.merchandise_id.in.map(() => '?').join(',')})`);
        params.push(...where.merchandise_id.in);
      } else {
        conditions.push('merchandise_id = ?');
        params.push(where.merchandise_id);
      }
    }
    if (where.OR) {
      const orConditions = where.OR.map((cond: any) => {
        const [field, op] = Object.entries(cond)[0];
        const fieldValue = Object.values(cond)[0];
        if (op === 'contains') {
          params.push(`%${fieldValue}%`);
          return `${field} LIKE ?`;
        }
        params.push(fieldValue);
        return `${field} = ?`;
      });
      conditions.push(`(${orConditions.join(' OR ')})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause with column whitelist to prevent SQL injection
    const validSortColumns = ['id', 'created_at', 'updated_at'];
    const sortColumn = (sortBy && validSortColumns.includes(sortBy)) ? sortBy : 'id';
    const sortDirection = (order === 'asc' ? 'ASC' : 'DESC');
    const orderByClause = `ORDER BY ${sortColumn} ${sortDirection}`;

    // Get total count
    let total: number;
    const hasFilters = conditions.length > 0;
    
    if (hasFilters) {
      const totalResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM redeem ${whereClause}`, ...params) as any[];
      total = Number(totalResult[0]?.count || 0);
    } else {
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as count FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'redeem'`
      ) as any[];
      total = Number(approxResult[0]?.count || 0);
    }

    // Create job with DB persistence
    const jobId = await exportJobManager.createJob(
      total,
      'NextJS.Export.RedeemExporter',
      0, // TODO: Get actual user ID from session
      { status, sortBy, order, search, dateFrom, dateTo, categoryId }
    );

    // Start the export process asynchronously (don't await)
    runExportJob(jobId, whereClause, orderByClause, params, total).catch(async error => {
      console.error(`Export job ${jobId} failed:`, error);
      await exportJobManager.failJob(jobId, error.message);
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
  orderByClause: string,
  params: any[],
  total: number
) {
  const { batchSize } = calculateDynamicBatchSize(total);
  
  // Mark job as started in DB
  try {
    await startExportJobDB(jobId);
  } catch (error) {
    console.error(`Failed to mark job ${jobId} as started in DB:`, error);
  }
  
  let redeems: any[] = [];
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
          const filename = `redeem-merchandise-${date}-${jobId}.xlsx`;
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
          id, merchandise_id, receiver_name, status, created_at, updated_at
        FROM redeem
        ${whereClause}
        ${orderByClause}
        LIMIT ${offset}, ${batchSize}`,
        ...params
      ) as any[];
      
      redeems.push(...batch);
      processed += batch.length;
      
      // Update progress (both in-memory and DB)
      await exportJobManager.updateProgress(jobId, processed, processed);
      console.log(`Export job ${jobId}: batch ${Math.ceil(processed / batchSize)} complete, processed ${processed}/${total} (${Math.round((processed / total) * 100)}%)`);
      
      offset += batchSize;
      hasMore = batch.length === batchSize;
    }

    // Get merchandise names for manual join
    const merchandiseIds = redeems.map(r => r.merchandise_id).filter(Boolean);
    const merchandiseItems = await prisma.merchandise.findMany({
      where: {
        id: { in: merchandiseIds as number[] },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const merchandiseMap = new Map(
      merchandiseItems.map(m => [m.id, m.name])
    );

    // Merge merchandise names into redeems and rename timestamp fields
    const redeemsWithMerchandise = redeems.map(redeem => ({
      ...redeem,
      merchandise_name: merchandiseMap.get(redeem.merchandise_id) || 'This item has been deleted',
      createdAt: redeem.created_at,
      updatedAt: redeem.updated_at,
    }));

    // Generate Excel file
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'merchandise_id', label: 'Merchandise ID' },
      { key: 'merchandise_name', label: 'Merchandise Name' },
      { key: 'receiver_name', label: 'Receiver Name' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At' }, // Mapped from created_at in merge step
      { key: 'updatedAt', label: 'Updated At' }, // Mapped from updated_at in merge step
    ];

    const worksheet = XLSX.utils.json_to_sheet(
      redeemsWithMerchandise.map(row => {
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
      const maxWidth = redeemsWithMerchandise.reduce((max, row) => {
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
    const filename = `redeem-merchandise-${date}-${jobId}.xlsx`;
    const filePath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Generate buffer and write with Node.js fs to avoid XLSX bundler detection issues
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buffer);

    // Mark job as completed (both in-memory and DB)
    await exportJobManager.completeJob(jobId, filename, processed);
    
  } catch (error: any) {
    console.error(`Export job ${jobId} failed:`, error);
    await exportJobManager.failJob(jobId, error.message);
    
    // Clean up partial file if it exists
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `redeem-merchandise-${date}-${jobId}.xlsx`;
      const filePath = path.join(process.cwd(), 'temp', filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (cleanupError) {
      console.error(`Failed to clean up partial file:`, cleanupError);
    }
  }
}