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

  if (status === 'active') {
    conditions.push('status = 1');
  } else if (status === 'inactive') {
    conditions.push('status = 0');
  }

  if (dateFrom) {
    conditions.push('publish_date >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('publish_date <= ?');
    params.push(dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause with column whitelist to prevent SQL injection
  const validSortColumns = ['id', 'publish_date', 'views', 'created_at'];
  const sortColumn = (sortBy && validSortColumns.includes(sortBy)) ? sortBy : 'id';
  const sortDirection = (order === 'asc' ? 'ASC' : 'DESC');
  const orderByClause = `ORDER BY ${sortColumn} ${sortDirection}`;

  // Use raw SQL for consistent WIB formatting
  const items = await prisma.$queryRawUnsafe(
    `SELECT
      id, title, title_en, content, content_en, img_url, caption_image, type, status, views, createdBy,
      DATE_FORMAT(publish_date, '%Y-%m-%dT%H:%i:%s') as publish_date,
      DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
      DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
    FROM news
    ${whereClause}
    ${orderByClause}`,
    ...params
  ) as any[];

  // Get counts - use approximate count for unfiltered queries for performance
  const hasFilters = conditions.length > 0;
  let totalCount: any[];
  
  if (hasFilters) {
    // Use exact COUNT(*) when filters are applied
    totalCount = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM news ${whereClause}`, ...params) as any[];
  } else {
    // Use cached approximate count for unfiltered queries (instant)
    const now = Date.now();
    if (cachedTotal && (now - cachedTotal.timestamp) < CACHE_TTL) {
      totalCount = [{ count: cachedTotal.count }];
    } else {
      // Cache miss or expired - fetch fresh approximate count
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as count FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'news'`
      ) as any[];
      totalCount = approxResult;
      cachedTotal = { count: Number(approxResult[0]?.count || 0), timestamp: now };
    }
  }
  
  const [activeCount, inactiveCount] = await Promise.all([
    prisma.news.count({ where: { status: 1 } }),
    prisma.news.count({ where: { status: 0 } }),
  ]);

  // Convert BigInt to string for JSON serialization
  const serializedItems = items.map(item => ({
    ...item,
    views: item.views ? item.views.toString() : '0',
  }));

  return NextResponse.json({
    data: serializedItems,
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
      INSERT INTO news (title, title_en, content, content_en, img_url, caption_image, type, status, publish_date, createdBy, created_at, updated_at)
      VALUES (
        ${data.title},
        ${data.title_en || null},
        ${data.content || '<p>-</p>'},
        ${data.content_en || '<p>-</p>'},
        ${data.img_url || ''},
        ${data.caption_image || ''},
        ${data.type || 'general'},
        ${data.status ?? 1},
        ${formatWIB(data.publish_date)},
        ${data.createdBy},
        ${formatWIB(new Date())},
        ${formatWIB(new Date())}
      )
    `;

    // Fetch the new item with proper WIB formatting
    const newItem = await prisma.$queryRaw`
      SELECT
        id, title, title_en, content, content_en, img_url, caption_image, type, status, views, createdBy,
        DATE_FORMAT(publish_date, '%Y-%m-%dT%H:%i:%s') as publish_date,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM news
      ORDER BY id DESC
      LIMIT 1
    ` as any[];

    const serialized = {
      ...newItem[0],
      views: newItem[0]?.views ? newItem[0].views.toString() : '0',
      creatorEmail: data.creatorEmail || null,
    };

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'news',
      recordId: String(newItem[0].id),
      action: 'CREATE',
      afterState: serialized,
    });

    return NextResponse.json(serialized);
  });
}
