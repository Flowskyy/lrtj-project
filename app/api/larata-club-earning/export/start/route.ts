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

// Helper function to get current year range in WIB
function getCurrentYearRangeWIB() {
  const now = new Date();
  // Convert to WIB (UTC+7)
  const wibOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
  const wibTime = new Date(now.getTime() + wibOffset);
  
  const currentYear = wibTime.getUTCFullYear();
  
  // Start of year: Jan 1 00:00:00 WIB
  const yearStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
  
  // End of year: Dec 31 23:59:59 WIB
  const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));
  
  return { yearStart, yearEnd, currentYear };
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search');
    const searchScope = searchParams.get('searchScope');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Get current year range in WIB
    const { yearStart, yearEnd } = getCurrentYearRangeWIB();

    const where: any = {};

    // MANDATORY: Restrict to current year only (hard restriction, cannot be bypassed)
    where.created_at = {
      gte: yearStart,
      lte: yearEnd,
    };

    // User date range filters are applied WITHIN the current year boundary
    if (dateFrom) {
      const userDateFrom = new Date(dateFrom);
      // Only apply if within current year
      if (userDateFrom >= yearStart && userDateFrom <= yearEnd) {
        where.created_at = { ...where.created_at, gte: userDateFrom };
      }
    }

    if (dateTo) {
      const userDateTo = new Date(dateTo + 'T23:59:59');
      // Only apply if within current year
      if (userDateTo >= yearStart && userDateTo <= yearEnd) {
        where.created_at = { ...where.created_at, lte: userDateTo };
      }
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (search && search.trim()) {
      const searchConditions: any[] = [];

      const userWhere: any = {};
      
      if (searchScope === 'user_email') {
        userWhere.email = { contains: search.trim() };
      } else if (searchScope === 'user_name') {
        userWhere.name = { contains: search.trim() };
      } else {
        // Default: search both name and email
        userWhere.OR = [
          { name: { contains: search.trim() } },
          { email: { contains: search.trim() } },
        ];
      }

      const matchingUsers = await prisma.users.findMany({
        where: userWhere,
        select: { id: true },
        take: 100,
      });

      if (matchingUsers.length > 0) {
        searchConditions.push({
          user_id: {
            in: matchingUsers.map(u => u.id),
          },
        });
      }

      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      } else {
        where.id = -1;
      }
    }

    // Validate sortBy against whitelist to prevent SQL injection
    const validSortColumns = ['id', 'created_at', 'earning_point'];
    const sortColumn = (sortBy && validSortColumns.includes(sortBy)) ? sortBy : 'created_at';
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
          const [field, fieldCond] = Object.entries(cond)[0];
          if (typeof fieldCond === 'object' && fieldCond !== null && !Array.isArray(fieldCond)) {
            const [op, fieldValue] = Object.entries(fieldCond)[0];
            const sqlOp = {
              in: 'IN',
            }[op] || '=';
            if (op === 'in') {
              orConditions.push(`${field} IN (${fieldValue.map(() => '?').join(',')})`);
              params.push(...fieldValue);
            } else {
              orConditions.push(`${field} ${sqlOp} ?`);
              params.push(fieldValue);
            }
          } else {
            orConditions.push(`${field} = ?`);
            params.push(fieldCond);
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
        `SELECT COUNT(*) as total FROM slc_earning_history ${whereClause}`,
        ...params
      ) as any[];
      total = Number(countResult[0]?.total || 0);
    } else {
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as total FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'slc_earning_history'`
      ) as any[];
      total = Number(approxResult[0]?.total || 0);
    }

    // Create job with DB persistence
    const jobId = await exportJobManager.createJob(
      total,
      'NextJS.Export.LarataClubEarningExporter',
      0, // TODO: Get actual user ID from session
      { sortBy, order, search, searchScope, category, type, dateFrom, dateTo }
    );

    // Start the export process asynchronously (don't await)
    runExportJob(jobId, whereClause, params, sortColumn, sortDirection, total).catch(async error => {
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
  params: any[],
  sortColumn: string,
  sortDirection: string,
  total: number
) {
  const { batchSize } = calculateDynamicBatchSize(total);
  
  // Mark job as started in DB
  try {
    await startExportJobDB(jobId);
  } catch (error) {
    console.error(`Failed to mark job ${jobId} as started in DB:`, error);
  }
  
  let earnings: any[] = [];
  let lastId = 0;
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
          const filename = `larata-club-earning-${date}-${jobId}.xlsx`;
          const filePath = path.join(process.cwd(), 'temp', filename);
          if (existsSync(filePath)) {
            await unlink(filePath);
          }
        } catch (cleanupError) {
          console.error(`Failed to clean up partial file on cancellation:`, cleanupError);
        }
        
        return;
      }

      const cursorClause = whereClause
        ? `${whereClause} AND id > ?`
        : `WHERE id > ?`;
      
      const batch = await prisma.$queryRawUnsafe(
        `SELECT
          id, user_id, category, type, earning_point, info,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at
        FROM slc_earning_history
        ${cursorClause}
        ORDER BY id ASC
        LIMIT ${batchSize}`,
        ...params,
        lastId
      ) as any[];

      earnings.push(...batch);
      processed += batch.length;
      
      // Update progress (both in-memory and DB)
      await exportJobManager.updateProgress(jobId, processed, processed);
      console.log(`Export job ${jobId}: batch ${Math.ceil(processed / batchSize)} complete, processed ${processed}/${total} (${Math.round((processed / total) * 100)}%)`);
      
      hasMore = batch.length === batchSize;
      if (hasMore) {
        lastId = Number(batch[batch.length - 1].id);
      }
    }

    // Get user information for manual join
    const userIds = [...new Set(earnings.map(e => e.user_id).filter(Boolean))];
    const userMap = new Map<number, { name: string | null; email: string | null }>();
    
    if (userIds.length > 0) {
      const userBatchSize = 1000;
      for (let i = 0; i < userIds.length; i += userBatchSize) {
        const batch = userIds.slice(i, i + userBatchSize);
        const users = await prisma.users.findMany({
          where: { id: { in: batch as number[] } },
          select: { id: true, name: true, email: true },
        });
        users.forEach(u => {
          userMap.set(u.id, { name: u.name, email: u.email });
        });
      }
    }

    // Merge user information
    const earningsWithUser = earnings.map(earning => ({
      ...earning,
      id: earning.id.toString(),
      user_name: userMap.get(earning.user_id)?.name || 'Unknown',
      user_email: userMap.get(earning.user_id)?.email || 'Unknown',
    }));

    // Generate Excel file
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'user_name', label: 'User Name' },
      { key: 'user_email', label: 'User Email' },
      { key: 'category', label: 'Category' },
      { key: 'type', label: 'Type' },
      { key: 'earning_point', label: 'Earning Point' },
      { key: 'info', label: 'Info' },
      { key: 'created_at', label: 'Created At' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(
      earningsWithUser.map(row => {
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
      const maxWidth = earningsWithUser.reduce((max, row) => {
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
    const filename = `larata-club-earning-${date}-${jobId}.xlsx`;
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
      const filename = `larata-club-earning-${date}-${jobId}.xlsx`;
      const filePath = path.join(process.cwd(), 'temp', filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (cleanupError) {
      console.error(`Failed to clean up partial file:`, cleanupError);
    }
  }
}
