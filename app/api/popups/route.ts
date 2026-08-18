import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatWIB } from '@/lib/utils';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Higher default for popups
    const skip = (page - 1) * limit;

    // Get total count
    const countResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM popups` as any[];
    const total = Number(countResult[0]?.total || 0);

    // Use raw SQL for consistent WIB formatting
    const popups = await prisma.$queryRaw`
      SELECT
        id, description, image_url, sequence, created_by,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM popups
      ORDER BY sequence ASC
      LIMIT ${limit} OFFSET ${skip}
    ` as any[];

    return NextResponse.json({
      popups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching popups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popups' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const session = await getSession();
      const body = await request.json();
      const { description, image_url } = body;

      if (!image_url) {
        return NextResponse.json(
          { error: 'Image URL is required' },
          { status: 400 }
        );
      }

      // Get the next sequence number
      const maxSequence = await prisma.$queryRaw`
        SELECT sequence FROM popups ORDER BY sequence DESC LIMIT 1
      ` as any[];

      const nextSequence = (maxSequence[0]?.sequence ?? 0) + 1;

      // Use raw SQL to store WIB time literally without timezone conversion
      await prisma.$queryRaw`
        INSERT INTO popups (description, image_url, sequence, created_at, updated_at, created_by)
        VALUES (
          ${description || null},
          ${image_url},
          ${nextSequence},
          ${formatWIB(new Date())},
          ${formatWIB(new Date())},
          ${session?.user?.name || null}
        )
      `;

      // Fetch the new item with proper WIB formatting
      const popup = await prisma.$queryRaw`
        SELECT
          id, description, image_url, sequence, created_by,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM popups
        ORDER BY id DESC
        LIMIT 1
      ` as any[];

      const serialized = popup[0];

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'popups',
        recordId: String(serialized.id),
        action: 'CREATE',
        afterState: serialized,
      });

      return NextResponse.json(serialized, { status: 201 });
    } catch (error) {
      console.error('Error creating popup:', error);
      return NextResponse.json(
        { error: 'Failed to create popup' },
        { status: 500 }
      );
    }
  });
}
