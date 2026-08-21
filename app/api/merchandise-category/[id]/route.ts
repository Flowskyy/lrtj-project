import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { formatWIB } from '@/lib/utils';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Use raw SQL for consistent WIB formatting
    const category = await prisma.$queryRaw`
      SELECT
        id, category_name, status,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM merchandise_category
      WHERE id = ${parseInt(id)}
    ` as any[];

    if (!category || category.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { category_name, status } = body;

      if (!category_name || category_name.trim() === '') {
        return NextResponse.json(
          { error: 'Category name is required' },
          { status: 400 }
        );
      }

      // Fetch the before state
      const beforeCategory = await prisma.$queryRaw`
        SELECT
          id, category_name, status,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM merchandise_category
        WHERE id = ${parseInt(id)}
      ` as any[];

      if (!beforeCategory || beforeCategory.length === 0) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }

      // Use raw SQL to store WIB time literally without timezone conversion
      await prisma.$queryRaw`
        UPDATE merchandise_category
        SET category_name = ${category_name.trim()},
            status = ${status !== undefined ? status : true},
            updated_at = ${formatWIB(new Date())}
        WHERE id = ${parseInt(id)}
      `;

      // Fetch the updated item with proper WIB formatting
      const category = await prisma.$queryRaw`
        SELECT
          id, category_name, status,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM merchandise_category
        WHERE id = ${parseInt(id)}
      ` as any[];

      // Calculate changed fields
      const changedFields = Object.keys(body).filter(key => {
        const beforeVal = beforeCategory[0][key];
        const afterVal = category[0][key];
        return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
      });

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'merchandise_category',
        recordId: id,
        action: 'UPDATE',
        beforeState: beforeCategory[0],
        afterState: category[0],
        changedFields: changedFields.length > 0 ? changedFields : undefined,
      });

      return NextResponse.json(category[0]);
    } catch (error) {
      console.error('Error updating category:', error);
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const { id } = await params;
      const { searchParams } = new URL(request.url);
      const force = searchParams.get('force') === 'true';

      // Fetch the before state
      const beforeCategory = await prisma.$queryRaw`
        SELECT
          id, category_name, status,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM merchandise_category
        WHERE id = ${parseInt(id)}
      ` as any[];

      if (!beforeCategory || beforeCategory.length === 0) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }

      if (force) {
        // Unassign and deactivate instead of force delete
        await prisma.$transaction(async (tx) => {
          // First unassign all merchandise items from this category
          await tx.merchandise.updateMany({
            where: { category_id: parseInt(id) },
            data: { category_id: null },
          });
          // Then deactivate the category instead of deleting it
          await tx.merchandise_category.update({
            where: { id: parseInt(id) },
            data: { status: false },
          });
        });

        // Log the activity (treat as UPDATE since we're deactivating, not deleting)
        await logManualActivity({
          tableName: 'merchandise_category',
          recordId: id,
          action: 'UPDATE',
          beforeState: beforeCategory[0],
          afterState: { ...beforeCategory[0], status: false },
          changedFields: ['status'],
        });

        return NextResponse.json({ success: true, unassignedAndDeactivated: true });
      }

      // Normal delete attempt (should fail due to FK constraint)
      try {
        await prisma.merchandise_category.delete({
          where: { id: parseInt(id) },
        });

        // Log the activity manually since we're using raw SQL
        await logManualActivity({
          tableName: 'merchandise_category',
          recordId: id,
          action: 'DELETE',
          beforeState: beforeCategory[0],
        });

        return NextResponse.json({ success: true });
      } catch (error: any) {
        if (error.code === 'P2003') {
          // Query affected merchandise items
          const affectedItems = await prisma.merchandise.findMany({
            where: { category_id: parseInt(id) },
            select: { id: true, name: true },
          });

          return NextResponse.json(
            {
              error: 'This category is still used by existing merchandise items. Use force delete to unassign items and deactivate the category.',
              affectedItems: affectedItems.map(item => ({ id: item.id, name: item.name })),
              forceDeleteAvailable: true,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }
  });
}
