import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';

// Simple in-memory cache for unfiltered total count (30 second TTL)
let cachedTotal: { count: number; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const debug = searchParams.get('debug');
    const exportMode = searchParams.get('export') === 'true';

    // Debug mode: return distinct category and type values
    if (debug === 'values') {
      const categories = await prisma.slc_earning_history.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });
      const types = await prisma.slc_earning_history.findMany({
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' },
      });
      return NextResponse.json({
        categories: categories.map(c => c.category),
        types: types.map(t => t.type),
      });
    }

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

    // Search by user name or email - need to find matching user IDs first
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

    // Only set OR if we have conditions, otherwise return empty results
    if (searchConditions.length > 0) {
      where.OR = searchConditions;
    } else {
      // No matching users found, return empty results
      where.id = -1; // This will match nothing
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

  // Build WHERE clause for reuse in both queries
  const whereClause = Object.keys(where).length > 0 ?
    'WHERE ' + Object.entries(where).map(([key, value]) => {
      if (key === 'OR') {
        const orConditions = (value as any[]).map((cond: any) => {
          const [field, op] = Object.entries(cond)[0];
          const fieldValue = Object.values(cond)[0];
          if (op === 'in') {
            // Quote string values in IN clause
            const quotedValues = (fieldValue as any[]).map((v: any) => typeof v === 'string' ? `'${v}'` : v);
            return `${field} IN (${quotedValues.join(',')})`;
          }
          // Quote string values in OR conditions
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
          // Format date for MySQL
          const formattedDate = val.toISOString().slice(0, 19).replace('T', ' ');
          return `${key} ${op.toUpperCase()} '${formattedDate}'`;
        }
        return `${key} ${op.toUpperCase()} ${val}`;
      }
      // Quote string values
      if (typeof value === 'string') {
        return `${key} = '${value}'`;
      }
      return `${key} = ${value}`;
    }).join(' AND ') : '';

  // Get total count - use approximate count for unfiltered queries for performance
  let total: number;
  const hasFilters = Object.keys(where).length > 0;
  
  if (hasFilters) {
    // Use exact COUNT(*) when filters are applied (necessary and typically faster)
    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM slc_earning_history ${whereClause}`
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
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'slc_earning_history'`
      ) as any[];
      total = Number(approxResult[0]?.total || 0);
      cachedTotal = { count: total, timestamp: now };
    }
  }

  // Use raw SQL for consistent WIB formatting
  let earnings: any[];
  
  if (exportMode) {
    // Batch fetching for large exports to prevent timeout/memory issues
    // Using keyset pagination on primary key `id` for performance (avoids OFFSET)
    const batchSize = 50000;
    earnings = [];
    let lastId = 0;
    let hasMore = true;

    while (hasMore) {
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
      hasMore = batch.length === batchSize;
      if (hasMore) {
        lastId = Number(batch[batch.length - 1].id);
      }
    }
  } else {
    // Normal paginated query
    earnings = await prisma.$queryRawUnsafe(
      `SELECT
        id, user_id, category, type, earning_point, info,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at
      FROM slc_earning_history
      ${whereClause}
      ${Object.keys(orderBy).length > 0 ? `ORDER BY ${Object.keys(orderBy)[0]} ${(Object.values(orderBy)[0] as string).toUpperCase()}` : 'ORDER BY created_at DESC'}
      LIMIT ${(page - 1) * limit}, ${limit}`
    ) as any[];
  }

  // Get user information for manual join - batched to handle large datasets
  const userIds = [...new Set(earnings.map(e => e.user_id).filter(Boolean))]; // Deduplicate
  
  const userMap = new Map<number, { name: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const userBatchSize = 1000;
    for (let i = 0; i < userIds.length; i += userBatchSize) {
      const batch = userIds.slice(i, i + userBatchSize);
      const users = await prisma.users.findMany({
        where: {
          id: { in: batch as number[] },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      users.forEach(u => {
        userMap.set(u.id, { name: u.name, email: u.email });
      });
    }
  }

  // Merge user information into earnings
  const earningsWithUser = earnings.map(earning => ({
    ...earning,
    id: earning.id.toString(),
    user_name: userMap.get(earning.user_id)?.name || 'Unknown',
    user_email: userMap.get(earning.user_id)?.email || 'Unknown',
  }));

  return NextResponse.json({
    data: earningsWithUser,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
