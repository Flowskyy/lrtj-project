import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';

// Simple in-memory cache for unfiltered total count (30 second TTL)
let cachedTotal: { count: number; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

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

    // Get current year range in WIB
    const { yearStart, yearEnd } = getCurrentYearRangeWIB();

    // Debug mode: return distinct category and type values
    if (debug === 'values') {
      const categories = await prisma.slc_earning_history.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
        where: {
          created_at: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
      });
      const types = await prisma.slc_earning_history.findMany({
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' },
        where: {
          created_at: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
      });
      return NextResponse.json({
        categories: categories.map(c => c.category),
        types: types.map(t => t.type),
      });
    }

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
    const searchScope = searchParams.get('searchScope');

    // Search by user name or email - need to find matching user IDs first
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
          const [field, fieldCond] = Object.entries(cond)[0];

          if (typeof fieldCond === 'object' && fieldCond !== null) {
            const [op, fieldValue] = Object.entries(fieldCond)[0];

            if (op === 'in') {
              // Handle IN clause with array of values
              const quotedValues = (fieldValue as any[]).map((v: any) => typeof v === 'string' ? `'${v}'` : v);
              return `${field} IN (${quotedValues.join(',')})`;
            }
          }
          // Handle simple equality
          if (typeof fieldCond === 'string') {
            return `${field} = '${fieldCond}'`;
          }
          return `${field} = ${fieldCond}`;
        }).join(' OR ');
        return `(${orConditions})`;
      }
      if (typeof value === 'object' && value !== null) {
        const [op, val] = Object.entries(value)[0];
        // Map Prisma operators to SQL operators
        const operatorMap: Record<string, string> = {
          gte: '>=',
          lte: '<=',
          gt: '>',
          lt: '<',
          equals: '=',
        };
        const sqlOp = operatorMap[op] || '>=';
        if (val instanceof Date) {
          // Format date for MySQL
          const formattedDate = val.toISOString().slice(0, 19).replace('T', ' ');
          return `${key} ${sqlOp} '${formattedDate}'`;
        }
        return `${key} ${sqlOp} ${val}`;
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
