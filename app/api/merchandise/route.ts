import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'asc';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const categoryId = searchParams.get('category_id');
  const search = searchParams.get('search');
  const searchScope = searchParams.get('searchScope');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

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

  // Add search conditions
  if (search && search.trim()) {
    const searchConditions: string[] = [];
    const searchTerm = search.trim();

    if (searchScope === 'editedBy') {
      searchConditions.push('m.editedBy LIKE ?');
      params.push(`%${searchTerm}%`);
    } else if (searchScope === 'name') {
      searchConditions.push('m.name LIKE ?');
      params.push(`%${searchTerm}%`);
    } else {
      // Default: search both name and editedBy
      searchConditions.push('(m.name LIKE ? OR m.editedBy LIKE ?)');
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    conditions.push(`(${searchConditions.join(' OR ')})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause with column whitelist to prevent SQL injection
  const validSortColumns = ['id', 'name', 'points', 'createdAt', 'editedBy'];
  const sortColumn = (sortBy && validSortColumns.includes(sortBy)) ? sortBy : 'id';
  const sortDirection = (order === 'asc' ? 'ASC' : 'DESC');
  const orderByClause = `ORDER BY ${sortColumn} ${sortDirection}`;

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM merchandise m ${whereClause}`;
  const totalCount = await prisma.$queryRawUnsafe(countQuery, ...params) as any[];
  const total = Number(totalCount[0]?.count || 0);

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
    ${orderByClause}
    LIMIT ${skip}, ${limit}`,
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

  const [activeCount, inactiveCount] = await Promise.all([
    prisma.merchandise.count({ where: { status: 1 } }),
    prisma.merchandise.count({ where: { status: 0 } }),
  ]);

  return NextResponse.json({
    data: itemsWithCategory,
    meta: {
      total,
      active: activeCount,
      inactive: inactiveCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
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

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'merchandise',
        recordId: String(itemWithCategory.id),
        action: 'CREATE',
        afterState: itemWithCategory,
      });

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
  });
}
