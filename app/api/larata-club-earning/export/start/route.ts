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
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (dateFrom) {
      where.created_at = { ...where.created_at, gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.created_at = { ...where.created_at, lte: new Date(dateTo + 'T23:59:59') };
    }

    if (search && search.trim()) {
      const searchConditions: any[] = [];

      const matchingUsers = await prisma.users.findMany({
        where: {
          OR: [
            { name: { contains: search.trim() } },
            { email: { contains: search.trim() } },
          ],
        },
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

    const orderBy: any = {};
    if (sortBy === 'id') {
      orderBy.id = order;
    } else if (sortBy === 'created_at') {
      orderBy.created_at = order;
    } else if (sortBy === 'earning_point') {
      orderBy.earning_point = order;
    } else {
      orderBy.created_at = 'desc';
    }

    // Build WHERE clause for reuse
    const whereClause = Object.keys(where).length > 0 ?
      'WHERE ' + Object.entries(where).map(([key, value]) => {
        if (key === 'OR') {
          const orConditions = (value as any[]).map((cond: any) => {
            const [field, op] = Object.entries(cond)[0];
            const fieldValue = Object.values(cond)[0];
            if (op === 'in') {
              const quotedValues = (fieldValue as any[]).map((v: any) => typeof v === 'string' ? `'${v}'` : v);
              return `${field} IN (${quotedValues.join(',')})`;
            }
            if (typeof fieldValue === 'string') {
              return `${field} = '${fieldValue}'`;
            }
            return `${field} = ${fieldValue}`;
          }).join(' OR ');
          return `(${orConditions})`;
        }
        if (typeof value === 'object' && value !== null) {
          const [op, val] = Object.entries(value)[0];
          if (val instanceof Date) {
            const formattedDate = val.toISOString().slice(0, 19).replace('T', ' ');
            return `${key} ${op.toUpperCase()} '${formattedDate}'`;
          }
          return `${key} ${op.toUpperCase()} ${val}`;
        }
        if (typeof value === 'string') {
          return `${key} = '${value}'`;
        }
        return `${key} = ${value}`;
      }).join(' AND ') : '';

    // Get total count
    let total: number;
    const hasFilters = Object.keys(where).length > 0;
    
    if (hasFilters) {
      const countResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total FROM slc_earning_history ${whereClause}`
      ) as any[];
      total = Number(countResult[0]?.total || 0);
    } else {
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as total FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'slc_earning_history'`
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
        console.log(`Export job ${jobId} cancelled, stopping batch loop`);
        
        // Clean up partial file if it exists
        try {
          const date = new Date().toISOString().split('T')[0];
          const filename = `larata-club-earning-${date}-${jobId}.xlsx`;
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

      const cursorClause = whereClause
        ? `${whereClause} AND id > ${lastId}`
        : `WHERE id > ${lastId}`;
      
      const batch = await prisma.$queryRawUnsafe(
        `SELECT
          id, user_id, category, type, earning_point, info,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at
        FROM slc_earning_history
        ${cursorClause}
        ORDER BY id ASC
        LIMIT ${batchSize}`
      ) as any[];

      earnings.push(...batch);
      processed += batch.length;
      
      // Update progress
      exportJobManager.updateProgress(jobId, processed);
      
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

    // Mark job as completed
    exportJobManager.completeJob(jobId, filename);
    
    console.log(`Export job ${jobId} completed successfully`);
  } catch (error: any) {
    console.error(`Export job ${jobId} failed:`, error);
    exportJobManager.failJob(jobId, error.message);
    
    // Clean up partial file if it exists
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `larata-club-earning-${date}-${jobId}.xlsx`;
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
