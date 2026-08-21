import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Use raw SQL without DATE_FORMAT() - use app-side formatting
  const item = await prisma.$queryRaw`
    SELECT
      m.id, m.name, m.redeem_point as points, m.image_url, m.term_condition as description, m.editedBy, m.status, m.category_id,
      m.created_at as createdAt,
      m.updated_at as updatedAt,
      c.id as category_id, c.category_name,
      COALESCE(u.email, m.editedBy) as display_email
    FROM merchandise m
    LEFT JOIN merchandise_category c ON m.category_id = c.id
    LEFT JOIN auth_users u ON m.editedBy = u.name COLLATE utf8mb4_unicode_ci
    WHERE m.id = ${parseInt(id)}
  ` as any[];

  if (!item || item.length === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const itemWithCategory = {
    ...item[0],
    category: item[0]?.category_id ? {
      id: item[0].category_id,
      category_name: item[0].category_name
    } : null,
    category_id: item[0]?.category_id
  };

  return NextResponse.json(itemWithCategory);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    const { id } = await params;
    const data = await request.json();
    try {
      // Fetch the before state without DATE_FORMAT()
      const beforeItem = await prisma.$queryRaw`
        SELECT
          m.id, m.name, m.redeem_point as points, m.image_url, m.term_condition as description, m.editedBy, m.status, m.category_id,
          m.created_at as createdAt,
          m.updated_at as updatedAt,
          c.id as category_id, c.category_name,
          COALESCE(u.email, m.editedBy) as display_email
        FROM merchandise m
        LEFT JOIN merchandise_category c ON m.category_id = c.id
        LEFT JOIN auth_users u ON m.editedBy = u.name COLLATE utf8mb4_unicode_ci
        WHERE m.id = ${parseInt(id)}
      ` as any[];

      if (!beforeItem || beforeItem.length === 0) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      // Use raw SQL to store WIB time literally without timezone conversion
      await prisma.$queryRaw`
        UPDATE merchandise 
        SET name = ${data.name},
            redeem_point = ${data.points},
            image_url = ${data.image_url},
            term_condition = ${data.description},
            editedBy = ${data.editedBy},
            status = ${data.status},
            category_id = ${data.category_id},
            updated_at = ${formatWIB(new Date())}
        WHERE id = ${parseInt(id)}
      `;

      // Fetch the updated item without DATE_FORMAT()
      const updatedItem = await prisma.$queryRaw`
        SELECT
          m.id, m.name, m.redeem_point as points, m.image_url, m.term_condition as description, m.editedBy, m.status, m.category_id,
          m.created_at as createdAt,
          m.updated_at as updatedAt,
          c.id as category_id, c.category_name,
          COALESCE(u.email, m.editedBy) as display_email
        FROM merchandise m
        LEFT JOIN merchandise_category c ON m.category_id = c.id
        LEFT JOIN auth_users u ON m.editedBy = u.name COLLATE utf8mb4_unicode_ci
        WHERE m.id = ${parseInt(id)}
      ` as any[];

      const itemWithCategory = {
        ...updatedItem[0],
        category: updatedItem[0]?.category_id ? {
          id: updatedItem[0].category_id,
          category_name: updatedItem[0].category_name
        } : null,
        category_id: updatedItem[0]?.category_id
      };

      // Calculate changed fields
      const changedFields = Object.keys(data).filter(key => {
        const beforeVal = beforeItem[0][key];
        const afterVal = updatedItem[0][key];
        return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
      });

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'merchandise',
        recordId: id,
        action: 'UPDATE',
        beforeState: beforeItem[0],
        afterState: itemWithCategory,
        changedFields,
      });

      return NextResponse.json(itemWithCategory);
    } catch (error) {
      console.error('Error updating merchandise:', error);
      if (error instanceof Error && error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid category selected' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update merchandise' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    const { id } = await params;
    
    // Fetch the before state without DATE_FORMAT()
    const beforeItem = await prisma.$queryRaw`
      SELECT
        m.id, m.name, m.redeem_point as points, m.image_url, m.term_condition as description, m.editedBy, m.status, m.category_id,
        m.created_at as createdAt,
        m.updated_at as updatedAt,
        c.id as category_id, c.category_name,
        COALESCE(u.email, m.editedBy) as display_email
      FROM merchandise m
      LEFT JOIN merchandise_category c ON m.category_id = c.id
      LEFT JOIN auth_users u ON m.editedBy = u.name COLLATE utf8mb4_unicode_ci
      WHERE m.id = ${parseInt(id)}
    ` as any[];

    if (!beforeItem || beforeItem.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await prisma.merchandise.delete({
      where: { id: parseInt(id) },
    });

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'merchandise',
      recordId: id,
      action: 'DELETE',
      beforeState: beforeItem[0],
    });

    return NextResponse.json({ message: 'Item deleted' });
  });
}
