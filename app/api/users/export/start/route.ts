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
    const gender = searchParams.get('gender');
    const verified = searchParams.get('verified');
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order') || 'asc';
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const activationSlc = searchParams.get('activation_slc');
    const tier = searchParams.get('tier');

    const where: any = {};

    if (status === 'active') {
      where.status = 1;
    } else if (status === 'inactive') {
      where.status = 0;
    } else if (status && status !== 'all') {
      const parsed = parseInt(status);
      if (!isNaN(parsed)) where.status = parsed;
    } else if (!status) {
      where.status = 1;
    }

    if (gender && gender !== 'all') {
      where.jenis_kelamin = gender;
    }

    if (activationSlc && activationSlc !== 'all') {
      where.activation_slc = parseInt(activationSlc);
    }

    if (tier && tier !== 'all') {
      where.member_level_id = parseInt(tier);
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

    if (search && search.trim()) {
      const searchNum = parseInt(search.trim());
      const searchConditions: any[] = [];

      if (!isNaN(searchNum)) {
        searchConditions.push({ id: searchNum });
      }

      searchConditions.push({ name: { contains: search.trim() } });
      searchConditions.push({ email: { contains: search.trim() } });
      searchConditions.push({ no_telepon: { contains: search.trim() } });

      where.OR = searchConditions;
    }

    const orderBy: any = {};
    if (sortBy === 'id' || sortBy === 'id_member') {
      orderBy.id = order;
    } else if (sortBy === 'nama' || sortBy === 'name') {
      orderBy.name = order;
    } else if (sortBy === 'email') {
      orderBy.email = order;
    } else if (sortBy === 'date_add' || sortBy === 'created_at') {
      orderBy.created_at = order;
    } else if (sortBy === 'lrtj_saldo') {
      orderBy.lrtj_saldo = order;
    } else if (sortBy === 'slc_point') {
      orderBy.slc_point = order;
    } else if (sortBy === 'trip_count') {
      orderBy.trip_count = order;
    } else {
      orderBy.id = 'desc';
    }

    // Build WHERE clause for raw SQL
    const conditions: string[] = [];
    const params: any[] = [];

    if (where.status !== undefined) {
      conditions.push('status = ?');
      params.push(where.status);
    }
    if (where.jenis_kelamin) {
      conditions.push('jenis_kelamin = ?');
      params.push(where.jenis_kelamin);
    }
    if (where.activation_slc !== undefined) {
      conditions.push('activation_slc = ?');
      params.push(where.activation_slc);
    }
    if (where.member_level_id !== undefined) {
      conditions.push('member_level_id = ?');
      params.push(where.member_level_id);
    }
    if (where.created_at) {
      if (where.created_at.gte) {
        conditions.push('created_at >= ?');
        params.push(where.created_at.gte);
      }
      if (where.created_at.lte) {
        conditions.push('created_at <= ?');
        params.push(where.created_at.lte);
      }
    }
    if (where.OR) {
      const orConditions = where.OR.map((cond: any) => {
        const [field, op] = Object.entries(cond)[0];
        const fieldValue = Object.values(cond)[0];
        if (op === 'contains') return `${field} LIKE ?`;
        return `${field} = ?`;
      });
      conditions.push(`(${orConditions.join(' OR ')})`);
      where.OR.forEach((cond: any) => {
        const fieldValue = Object.values(cond)[0];
        if (typeof fieldValue === 'string' && fieldValue.includes && fieldValue.includes('%')) {
          params.push(fieldValue);
        } else {
          params.push(fieldValue);
        }
      });
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderByClause = 'ORDER BY id DESC';
    if (orderBy.id) orderByClause = `ORDER BY id ${orderBy.id.toUpperCase()}`;
    else if (orderBy.name) orderByClause = `ORDER BY name ${orderBy.name.toUpperCase()}`;
    else if (orderBy.email) orderByClause = `ORDER BY email ${orderBy.email.toUpperCase()}`;
    else if (orderBy.created_at) orderByClause = `ORDER BY created_at ${orderBy.created_at.toUpperCase()}`;
    else if (orderBy.lrtj_saldo) orderByClause = `ORDER BY lrtj_saldo ${orderBy.lrtj_saldo.toUpperCase()}`;
    else if (orderBy.slc_point) orderByClause = `ORDER BY slc_point ${orderBy.slc_point.toUpperCase()}`;
    else if (orderBy.trip_count) orderByClause = `ORDER BY trip_count ${orderBy.trip_count.toUpperCase()}`;

    // Get total count
    let total: number;
    const hasFilters = conditions.length > 0;
    
    if (hasFilters) {
      const totalResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM users ${whereClause}`, ...params) as any[];
      total = Number(totalResult[0]?.count || 0);
    } else {
      const now = Date.now();
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as count FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'users'`
      ) as any[];
      total = Number(approxResult[0]?.count || 0);
    }

    // Create job
    const jobId = exportJobManager.createJob(total);

    // Start the export process asynchronously (don't await)
    runExportJob(jobId, whereClause, orderByClause, params, total).catch(error => {
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
  orderByClause: string,
  params: any[],
  total: number
) {
  const batchSize = 50000;
  let users: any[] = [];
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
          const filename = `users-${date}-${jobId}.xlsx`;
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
          id, email, no_telepon, jenis_kelamin, nik, alamat, tempat_lahir, name, image, status,
          DATE_FORMAT(birthday, '%Y-%m-%dT%H:%i:%s') as birthday, province_id, regency_id, ecard, ecard2, lrtj_saldo, slc_point, trip_count,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM users
        ${whereClause}
        ${orderByClause}
        LIMIT ${offset}, ${batchSize}`,
        ...params
      ) as any[];
      
      users.push(...batch);
      processed += batch.length;
      
      // Update progress
      exportJobManager.updateProgress(jobId, processed);
      
      offset += batchSize;
      hasMore = batch.length === batchSize;
    }

    // Generate Excel file
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'no_telepon', label: 'Phone' },
      { key: 'jenis_kelamin', label: 'Gender' },
      { key: 'lrtj_saldo', label: 'LRTJ Saldo' },
      { key: 'slc_point', label: 'SLC Point' },
      { key: 'trip_count', label: 'Trip Count' },
      { key: 'created_at', label: 'Created At' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(
      users.map(row => {
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
      const maxWidth = users.reduce((max, row) => {
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
    const filename = `users-${date}-${jobId}.xlsx`;
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
      const filename = `users-${date}-${jobId}.xlsx`;
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
