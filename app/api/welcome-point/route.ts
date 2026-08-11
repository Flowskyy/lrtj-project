import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';
  
export async function GET(request: Request) {
  try {
    // Use raw SQL to bypass Prisma's timezone conversion
    const result = await prisma.$queryRaw`
      SELECT
        id,
        point,
        default_point,
        updated_by,
        DATE_FORMAT(active_from, '%Y-%m-%dT%H:%i:%s') as active_from,
        DATE_FORMAT(active_to, '%Y-%m-%dT%H:%i:%s') as active_to,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM welcome_point
      ORDER BY id ASC
      LIMIT 1
    ` as any[];

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'No welcome point configuration found' },
        { status: 404 }
      );
    }

    const welcomePoint = result[0];

    return NextResponse.json(welcomePoint);
  } catch (error) {
    console.error('Error fetching welcome point:', error);
    return NextResponse.json(
      { error: 'Failed to fetch welcome point configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const body = await request.json();
      const { point, default_point, active_from, active_to, updated_by } = body;

      if (point === undefined || point === null) {
        return NextResponse.json(
          { error: 'Point value is required' },
          { status: 400 }
        );
      }

      if (default_point === undefined || default_point === null) {
        return NextResponse.json(
          { error: 'Default point value is required' },
          { status: 400 }
        );
      }

      if (!updated_by) {
        return NextResponse.json(
          { error: 'Updated by information is required' },
          { status: 400 }
        );
      }

      // Get the first record ID
      const existing = await prisma.$queryRaw`
        SELECT id FROM welcome_point ORDER BY id ASC LIMIT 1
      ` as any[];

      if (!existing || existing.length === 0) {
        return NextResponse.json(
          { error: 'No welcome point configuration found to update' },
          { status: 404 }
        );
      }

      const id = existing[0].id;

      // Fetch the before state
      const beforeItem = await prisma.$queryRaw`
        SELECT
          id,
          point,
          default_point,
          updated_by,
          DATE_FORMAT(active_from, '%Y-%m-%dT%H:%i:%s') as active_from,
          DATE_FORMAT(active_to, '%Y-%m-%dT%H:%i:%s') as active_to,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM welcome_point
        WHERE id = ${id}
      ` as any[];

      // Use raw SQL to bypass Prisma's timezone conversion
      await prisma.$queryRaw`
        UPDATE welcome_point
        SET
          point = ${point},
          default_point = ${default_point},
          active_from = ${active_from || null},
          active_to = ${active_to || null},
          updated_by = ${updated_by},
          updated_at = NOW()
        WHERE id = ${id}
      `;

      // Fetch the updated record using raw SQL
      const result = await prisma.$queryRaw`
        SELECT
          id,
          point,
          default_point,
          updated_by,
          DATE_FORMAT(active_from, '%Y-%m-%dT%H:%i:%s') as active_from,
          DATE_FORMAT(active_to, '%Y-%m-%dT%H:%i:%s') as active_to,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM welcome_point
        WHERE id = ${id}
      ` as any[];

      // Calculate changed fields
      const changedFields = Object.keys(body).filter(key => {
        const beforeVal = beforeItem[0][key];
        const afterVal = result[0][key];
        return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
      });

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'welcome_point',
        recordId: String(id),
        action: 'UPDATE',
        beforeState: beforeItem[0],
        afterState: result[0],
        changedFields,
      });

      return NextResponse.json(result[0]);
    } catch (error) {
      console.error('Error updating welcome point:', error);
      return NextResponse.json(
        { error: 'Failed to update welcome point configuration' },
        { status: 500 }
      );
    }
  });
}