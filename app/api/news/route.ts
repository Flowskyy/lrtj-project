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
  const search = searchParams.get('search');
  const searchScope = searchParams.get('searchScope');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

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

  // Add search conditions
  if (search && search.trim()) {
    const searchConditions: string[] = [];
    const searchTerm = search.trim();

    if (searchScope === 'createdBy') {
      searchConditions.push('(createdBy LIKE ? OR createdBy IN (SELECT name COLLATE utf8mb4_unicode_ci FROM auth_users WHERE email LIKE ?))');
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    } else if (searchScope === 'title') {
      searchConditions.push('(title LIKE ? OR title_en LIKE ?)');
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    } else {
      // Default: search both title and createdBy
      searchConditions.push('(title LIKE ? OR title_en LIKE ? OR createdBy LIKE ? OR createdBy IN (SELECT name COLLATE utf8mb4_unicode_ci FROM auth_users WHERE email LIKE ?))');
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    conditions.push(`(${searchConditions.join(' OR ')})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause with column whitelist to prevent SQL injection
  const validSortColumns = ['id', 'publish_date', 'views', 'created_at'];
  const sortColumn = (sortBy && validSortColumns.includes(sortBy)) ? sortBy : 'id';
  const sortDirection = (order === 'asc' ? 'ASC' : 'DESC');
  const orderByClause = `ORDER BY ${sortColumn} ${sortDirection}`;

  // Use raw SQL without DATE_FORMAT() - use app-side formatting instead
  const items = await prisma.$queryRawUnsafe(
    `SELECT
      id, title, title_en, content, content_en, img_url, caption_image, type, status, views, createdBy,
      publish_date, created_at, updated_at
    FROM news
    ${whereClause}
    ${orderByClause}
    LIMIT ${skip}, ${limit}`,
    ...params
  ) as any[];

  // Get counts - use single query with conditional aggregation for performance
  const hasFilters = conditions.length > 0;
  let totalCount: number;
  let activeCount: number;
  let inactiveCount: number;

  if (hasFilters) {
    // Use exact COUNT with conditional aggregation when filters are applied
    const countResult = await prisma.$queryRawUnsafe(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive
       FROM news ${whereClause}`,
      ...params
    ) as any[];
    totalCount = Number(countResult[0]?.total || 0);
    activeCount = Number(countResult[0]?.active || 0);
    inactiveCount = Number(countResult[0]?.inactive || 0);
  } else {
    // Use cached approximate count for unfiltered queries (instant)
    const now = Date.now();
    if (cachedTotal && (now - cachedTotal.timestamp) < CACHE_TTL) {
      totalCount = cachedTotal.count;
    } else {
      // Cache miss or expired - fetch fresh approximate count
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as count FROM information_schema.tables
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'news'`
      ) as any[];
      totalCount = Number(approxResult[0]?.count || 0);
      cachedTotal = { count: totalCount, timestamp: now };
    }
    
    // Get active/inactive counts with single query
    const statusCounts = await prisma.$queryRawUnsafe(
      `SELECT 
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive
       FROM news`
    ) as any[];
    activeCount = Number(statusCounts[0]?.active || 0);
    inactiveCount = Number(statusCounts[0]?.inactive || 0);
  }

  // Convert BigInt to string for JSON serialization
  const serializedItems = items.map(item => ({
    ...item,
    views: item.views ? item.views.toString() : '0',
  }));

  return NextResponse.json({
    data: serializedItems,
    meta: {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
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

    // Fetch the new item without DATE_FORMAT() - use app-side formatting
    const newItem = await prisma.$queryRaw`
      SELECT
        id, title, title_en, content, content_en, img_url, caption_image, type, status, views, createdBy,
        publish_date, created_at, updated_at
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
