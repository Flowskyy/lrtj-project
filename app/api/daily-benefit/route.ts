import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

// Simple in-memory cache for unfiltered total count (30 second TTL)
let cachedTotal: { count: number; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'asc';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  // Build WHERE clause for raw SQL
  const conditions: string[] = [];
  const params: any[] = [];

  if (status === 'active' || status === '1') {
    conditions.push('status = 1');
  } else if (status === 'inactive' || status === '0') {
    conditions.push('status = 0');
  }

  if (dateFrom) {
    conditions.push('created_at >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('created_at <= ?');
    params.push(dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause
  let orderByClause = 'ORDER BY id ASC';
  if (sortBy === 'id') {
    orderByClause = `ORDER BY id ${order.toUpperCase()}`;
  } else if (sortBy === 'createdAt') {
    orderByClause = `ORDER BY created_at ${order.toUpperCase()}`;
  } else if (sortBy === 'editedBy') {
    orderByClause = `ORDER BY editedBy ${order.toUpperCase()}`;
  }

  // Use raw SQL for consistent WIB formatting
  const items = await prisma.$queryRawUnsafe(
    `SELECT
      id, name, redeem_point, image_url, term_condition, editedBy, status, start_date, end_date, is_active,
      DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
      DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
    FROM daily_benefit
    ${whereClause}
    ${orderByClause}`,
    ...params
  ) as any[];

  // Get counts - use approximate count for unfiltered queries for performance
  const hasFilters = conditions.length > 0;
  let totalCount: any[];
  
  if (hasFilters) {
    // Use exact COUNT(*) when filters are applied
    totalCount = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM daily_benefit ${whereClause}`, ...params) as any[];
  } else {
    // Use cached approximate count for unfiltered queries (instant)
    const now = Date.now();
    if (cachedTotal && (now - cachedTotal.timestamp) < CACHE_TTL) {
      totalCount = [{ count: cachedTotal.count }];
    } else {
      // Cache miss or expired - fetch fresh approximate count
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as count FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'daily_benefit'`
      ) as any[];
      totalCount = approxResult;
      cachedTotal = { count: Number(approxResult[0]?.count || 0), timestamp: now };
    }
  }
  
  const [activeCount, inactiveCount] = await Promise.all([
    prisma.daily_benefit.count({ where: { status: 1 } }),
    prisma.daily_benefit.count({ where: { status: 0 } }),
  ]);

  return NextResponse.json({
    data: items,
    meta: {
      total: Number(totalCount[0]?.count || 0),
      active: activeCount,
      inactive: inactiveCount,
    },
  });
}

export async function POST(request: NextRequest) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    const data = await request.json();

    // Use raw SQL to store WIB time literally without timezone conversion
    await prisma.$queryRaw`
      INSERT INTO daily_benefit (name, redeem_point, image_url, term_condition, editedBy, status, start_date, end_date, is_active, created_at, updated_at)
      VALUES (
        ${data.name},
        ${data.redeem_point},
        ${data.image_url || ''},
        ${data.term_condition || '<p>-</p>'},
        ${data.editedBy},
        ${data.status ?? 1},
        ${formatWIB(data.start_date)},
        ${formatWIB(data.end_date)},
        ${data.is_active ?? 1},
        ${formatWIB(new Date())},
        ${formatWIB(new Date())}
      )
    `;

    // Fetch the new item with proper WIB formatting
    const newItem = await prisma.$queryRaw`
      SELECT
        id, name, redeem_point, image_url, term_condition, editedBy, status, start_date, end_date, is_active,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM daily_benefit
      ORDER BY id DESC
      LIMIT 1
    ` as any[];

    const serialized = newItem[0];

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'daily_benefit',
      recordId: String(serialized.id),
      action: 'CREATE',
      afterState: serialized,
    });

    return NextResponse.json(serialized);
  });
}
