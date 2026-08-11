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

  // Use raw SQL for consistent WIB formatting
  const item = await prisma.$queryRaw`
    SELECT
      id, name, redeem_point, image_url, term_condition, editedBy, status, start_date, end_date, is_active,
      DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
      DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
    FROM daily_benefit
    WHERE id = ${parseInt(id)}
  ` as any[];

  if (!item || item.length === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  return NextResponse.json(item[0]);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    const { id } = await params;
    const data = await request.json();

    // Fetch the before state
    const beforeItem = await prisma.$queryRaw`
      SELECT
        id, name, redeem_point, image_url, term_condition, editedBy, status, start_date, end_date, is_active,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM daily_benefit
      WHERE id = ${parseInt(id)}
    ` as any[];

    if (!beforeItem || beforeItem.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Use raw SQL to store WIB time literally without timezone conversion
    await prisma.$queryRaw`
      UPDATE daily_benefit
      SET name = ${data.name},
          redeem_point = ${data.redeem_point},
          image_url = ${data.image_url},
          term_condition = ${data.term_condition},
          editedBy = ${data.editedBy},
          status = ${data.status},
          start_date = ${formatWIB(data.start_date)},
          end_date = ${formatWIB(data.end_date)},
          is_active = ${data.is_active},
          updated_at = ${formatWIB(new Date())}
      WHERE id = ${parseInt(id)}
    `;

    // Fetch the updated item with proper WIB formatting
    const updatedItem = await prisma.$queryRaw`
      SELECT
        id, name, redeem_point, image_url, term_condition, editedBy, status, start_date, end_date, is_active,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM daily_benefit
      WHERE id = ${parseInt(id)}
    ` as any[];

    // Calculate changed fields
    const changedFields = Object.keys(data).filter(key => {
      const beforeVal = beforeItem[0][key];
      const afterVal = updatedItem[0][key];
      return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
    });

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'daily_benefit',
      recordId: id,
      action: 'UPDATE',
      beforeState: beforeItem[0],
      afterState: updatedItem[0],
      changedFields,
    });

    return NextResponse.json(updatedItem[0]);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    const { id } = await params;
    
    // Fetch the before state
    const beforeItem = await prisma.$queryRaw`
      SELECT
        id, name, redeem_point, image_url, term_condition, editedBy, status, start_date, end_date, is_active,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM daily_benefit
      WHERE id = ${parseInt(id)}
    ` as any[];

    if (!beforeItem || beforeItem.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await prisma.daily_benefit.delete({
      where: { id: parseInt(id) },
    });

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'daily_benefit',
      recordId: id,
      action: 'DELETE',
      beforeState: beforeItem[0],
    });

    return NextResponse.json({ message: 'Item deleted' });
  });
}
