import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    // Use raw SQL for consistent WIB formatting
    const categories = await prisma.$queryRawUnsafe(
      `SELECT
        id, category_name, status${all ? ', DATE_FORMAT(created_at, \'%Y-%m-%dT%H:%i:%s\') as created_at, DATE_FORMAT(updated_at, \'%Y-%m-%dT%H:%i:%s\') as updated_at' : ''}
      FROM merchandise_category
      ${all ? '' : 'WHERE status = true'}
      ORDER BY id ASC`
    ) as any[];

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const body = await request.json();
      const { category_name, status } = body;

      if (!category_name || category_name.trim() === '') {
        return NextResponse.json(
          { error: 'Category name is required' },
          { status: 400 }
        );
      }

      // Use raw SQL to store WIB time literally without timezone conversion
      await prisma.$queryRaw`
        INSERT INTO merchandise_category (category_name, status, created_at, updated_at)
        VALUES (
          ${category_name.trim()},
          ${status !== undefined ? status : true},
          ${formatWIB(new Date())},
          ${formatWIB(new Date())}
        )
      `;

      // Fetch the new item with proper WIB formatting
      const category = await prisma.$queryRaw`
        SELECT
          id, category_name, status,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM merchandise_category
        ORDER BY id DESC
        LIMIT 1
      ` as any[];

      const serialized = category[0];

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'merchandise_category',
        recordId: String(serialized.id),
        action: 'CREATE',
        afterState: serialized,
      });

      return NextResponse.json(serialized, { status: 201 });
    } catch (error) {
      console.error('Error creating category:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }
  });
}
