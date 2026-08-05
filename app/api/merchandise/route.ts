import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';

// Simple in-memory cache for unfiltered total count (30 second TTL)
let cachedTotal: { count: number; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'asc';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const categoryId = searchParams.get('category_id');

  // Build WHERE clause for raw SQL
  const conditions: string[] = [];
  const params: any[] = [];

  if (dateFrom) {
    conditions.push('createdAt >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('createdAt <= ?');
    params.push(dateTo);
  }

  if (categoryId) {
    if (categoryId === 'uncategorized') {
      conditions.push('category_id IS NULL');
    } else {
      conditions.push('category_id = ?');
      params.push(parseInt(categoryId));
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause
  let orderByClause = 'ORDER BY id ASC';
  if (sortBy === 'id') {
    orderByClause = `ORDER BY id ${order.toUpperCase()}`;
  } else if (sortBy === 'createdAt') {
    orderByClause = `ORDER BY createdAt ${order.toUpperCase()}`;
  } else if (sortBy === 'editedBy') {
    orderByClause = `ORDER BY editedBy ${order.toUpperCase()}`;
  }

  // Use raw SQL for consistent WIB formatting
  const items = await prisma.$queryRawUnsafe(
    `SELECT
      m.id, m.name, m.redeem_point as points, m.image_url, m.term_condition as description, m.editedBy, m.status, m.category_id,
      DATE_FORMAT(m.created_at, '%Y-%m-%dT%H:%i:%s') as createdAt,
      DATE_FORMAT(m.updated_at, '%Y-%m-%dT%H:%i:%s') as updatedAt,
      c.id as category_id, c.category_name,
      COALESCE(u.email, m.editedBy) as display_email
    FROM merchandise m
    LEFT JOIN merchandise_category c ON m.category_id = c.id
    LEFT JOIN auth_users u ON m.editedBy = u.name COLLATE utf8mb4_unicode_ci
    ${whereClause}
    ${orderByClause}`,
    ...params
  ) as any[];

  // Rebuild the structure to match Prisma's include pattern
  const itemsWithCategory = items.map(item => ({
    ...item,
    id: item.id.toString(),
    merchandise_category: item.category_id ? {
      id: item.category_id,
      category_name: item.category_name
    } : null,
    category_id: item.category_id
  }));

  // Get counts - use approximate count for unfiltered queries for performance
  const hasFilters = conditions.length > 0;
  let totalCount: any[];
  
  if (hasFilters) {
    // Use exact COUNT(*) when filters are applied
    totalCount = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM merchandise ${whereClause}`, ...params) as any[];
  } else {
    // Use cached approximate count for unfiltered queries (instant)
    const now = Date.now();
    if (cachedTotal && (now - cachedTotal.timestamp) < CACHE_TTL) {
      totalCount = [{ count: cachedTotal.count }];
    } else {
      // Cache miss or expired - fetch fresh approximate count
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as count FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'merchandise'`
      ) as any[];
      totalCount = approxResult;
      cachedTotal = { count: Number(approxResult[0]?.count || 0), timestamp: now };
    }
  }
  
  const [activeCount, inactiveCount] = await Promise.all([
    prisma.merchandise.count({ where: { status: 1 } }),
    prisma.merchandise.count({ where: { status: 0 } }),
  ]);

  return NextResponse.json({
    data: itemsWithCategory,
    meta: {
      total: Number(totalCount[0]?.count || 0),
      active: activeCount,
      inactive: inactiveCount,
    },
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  try {
    // Use raw SQL to store WIB time literally without timezone conversion
    await prisma.$queryRaw`
      INSERT INTO merchandise (name, redeem_point, image_url, term_condition, editedBy, status, category_id, created_at, updated_at)
      VALUES (
        ${data.name},
        ${data.points},
        ${data.image_url || ''},
        ${data.description || '<p>-</p>'},
        ${data.editedBy},
        ${data.status ?? 1},
        ${data.category_id},
        ${formatWIB(new Date())},
        ${formatWIB(new Date())}
      )
    `;

    // Fetch the new item with proper WIB formatting
    const newItem = await prisma.$queryRaw`
      SELECT
        m.id, m.name, m.redeem_point as points, m.image_url, m.term_condition as description, m.editedBy, m.status, m.category_id,
        DATE_FORMAT(m.created_at, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(m.updated_at, '%Y-%m-%dT%H:%i:%s') as updatedAt,
        c.id as category_id, c.category_name,
        COALESCE(u.email, m.editedBy) as display_email
      FROM merchandise m
      LEFT JOIN merchandise_category c ON m.category_id = c.id
      LEFT JOIN auth_users u ON m.editedBy = u.name COLLATE utf8mb4_unicode_ci
      ORDER BY m.id DESC
      LIMIT 1
    ` as any[];

    const itemWithCategory = {
      ...newItem[0],
      merchandise_category: newItem[0]?.category_id ? {
        id: newItem[0].category_id,
        category_name: newItem[0].category_name
      } : null,
      category_id: newItem[0]?.category_id
    };

    return NextResponse.json(itemWithCategory);
  } catch (error) {
    console.error('Error creating merchandise:', error);
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { error: 'Invalid category selected' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create merchandise' },
      { status: 500 }
    );
  }
}
