import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';

// Simple in-memory cache for unfiltered total count (30 second TTL)
let cachedTotal: { count: number; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search');
  const searchScope = searchParams.get('searchScope');
  const debug = searchParams.get('debug');
  const exportMode = searchParams.get('export') === 'true';

  // Debug mode: return distinct status values
  if (debug === 'status') {
    const statusCounts = await prisma.redeem_benefit.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      orderBy: {
        status: 'asc',
      },
    });
    return NextResponse.json(statusCounts);
  }

  const where: any = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

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
      searchConditions.push({ user_id: searchNum });
      searchConditions.push({ merchant_id: searchNum });
    }

    // Apply search scope if provided
    if (searchScope === 'name') {
      searchConditions.push({ name: { contains: search.trim() } });
    } else if (searchScope === 'email') {
      searchConditions.push({ email: { contains: search.trim() } });
    } else {
      // Default: search both fields if no scope specified
      searchConditions.push({ name: { contains: search.trim() } });
      searchConditions.push({ email: { contains: search.trim() } });
    }

    where.OR = searchConditions;
  }

  const orderBy: any = {};
  if (sortBy === 'id') {
    orderBy.id = order;
  } else if (sortBy === 'created_at') {
    orderBy.created_at = order;
  } else if (sortBy === 'updated_at') {
    orderBy.updated_at = order;
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

  // Use raw SQL for consistent WIB formatting
  let redeemBenefits: any[];
  
  if (exportMode) {
    // Batch fetching for large exports to prevent timeout/memory issues
    const batchSize = 50000;
    redeemBenefits = [];
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
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
      offset += batchSize;
      hasMore = batch.length === batchSize;
    }
  } else {
    // Normal paginated query
    redeemBenefits = await prisma.$queryRawUnsafe(
      `SELECT
        id, user_id, merchant_id, name, email, status,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM redeem_benefit
      ${whereClause}
      ${Object.keys(orderBy).length > 0 ? `ORDER BY ${Object.keys(orderBy)[0]} ${(Object.values(orderBy)[0] as string).toUpperCase()}` : 'ORDER BY id DESC'}
      LIMIT ${(page - 1) * limit}, ${limit}`
    ) as any[];
  }

  // Get total count - use approximate count for unfiltered queries for performance
  let total: number;
  const hasFilters = Object.keys(where).length > 0;
  
  if (hasFilters) {
    // Use exact COUNT(*) when filters are applied (necessary and typically faster)
    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM redeem_benefit ${whereClause}`
    ) as any[];
    total = Number(countResult[0]?.total || 0);
  } else {
    // Use cached approximate count for unfiltered queries (instant)
    const now = Date.now();
    if (cachedTotal && (now - cachedTotal.timestamp) < CACHE_TTL) {
      total = cachedTotal.count;
    } else {
      // Cache miss or expired - fetch fresh approximate count
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as total FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'redeem_benefit'`
      ) as any[];
      total = Number(approxResult[0]?.total || 0);
      cachedTotal = { count: total, timestamp: now };
    }
  }

  // Get status counts for stat cards
  const statusCounts = await prisma.redeem_benefit.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const statusCountMap = new Map(
    statusCounts.map(sc => [sc.status, sc._count.id])
  );

  // Get completed count
  const completedCount = statusCountMap.get('completed') || 0;

  return NextResponse.json({
    data: redeemBenefits,
    meta: {
      total,
      completed: completedCount,
      statusCounts: Object.fromEntries(statusCountMap),
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
