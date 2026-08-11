import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const popup = await prisma.popups.findUnique({
      where: { id: parseInt(id) },
    });

    if (!popup) {
      return NextResponse.json(
        { error: 'Popup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(popup);
  } catch (error) {
    console.error('Error fetching popup:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popup' },
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
      const session = await getSession();
      const { id } = await params;
      const body = await request.json();
      const { description, image_url } = body;

      if (!image_url) {
        return NextResponse.json(
          { error: 'Image URL is required' },
          { status: 400 }
        );
      }

      // Fetch the before state
      const beforePopup = await prisma.$queryRaw`
        SELECT
          id, description, image_url, sequence, created_by,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM popups
        WHERE id = ${parseInt(id)}
      ` as any[];

      if (!beforePopup || beforePopup.length === 0) {
        return NextResponse.json(
          { error: 'Popup not found' },
          { status: 404 }
        );
      }

      const popup = await prisma.popups.update({
        where: { id: parseInt(id) },
        data: {
          description: description || null,
          image_url,
          updated_at: new Date(),
          updated_by: session?.user?.name || null,
        },
      });

      // Fetch the after state
      const afterPopup = await prisma.$queryRaw`
        SELECT
          id, description, image_url, sequence, created_by,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM popups
        WHERE id = ${parseInt(id)}
      ` as any[];

      // Calculate changed fields
      const changedFields = Object.keys(body).filter(key => {
        const beforeVal = beforePopup[0][key];
        const afterVal = afterPopup[0][key];
        return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
      });

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'popups',
        recordId: id,
        action: 'UPDATE',
        beforeState: beforePopup[0],
        afterState: afterPopup[0],
        changedFields,
      });

      return NextResponse.json(popup);
    } catch (error) {
      console.error('Error updating popup:', error);
      return NextResponse.json(
        { error: 'Failed to update popup' },
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
      
      // Get the before state
      const beforePopup = await prisma.$queryRaw`
        SELECT
          id, description, image_url, sequence, created_by,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM popups
        WHERE id = ${parseInt(id)}
      ` as any[];

      if (!beforePopup || beforePopup.length === 0) {
        return NextResponse.json(
          { error: 'Popup not found' },
          { status: 404 }
        );
      }

      // Get the sequence of the popup being deleted
      const deletedPopup = await prisma.popups.findUnique({
        where: { id: parseInt(id) },
        select: { sequence: true },
      });

      // Delete the popup
      await prisma.popups.delete({
        where: { id: parseInt(id) },
      });

      // Re-sequence remaining popups to keep them contiguous
      const remainingPopups = await prisma.popups.findMany({
        where: { sequence: { gt: deletedPopup.sequence } },
        orderBy: { sequence: 'asc' },
      });

      // Update sequence values in a transaction
      await prisma.$transaction(
        remainingPopups.map((popup) =>
          prisma.popups.update({
            where: { id: popup.id },
            data: { sequence: popup.sequence - 1 },
          })
        )
      );

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'popups',
        recordId: id,
        action: 'DELETE',
        beforeState: beforePopup[0],
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting popup:', error);
      return NextResponse.json(
        { error: 'Failed to delete popup' },
        { status: 500 }
      );
    }
  });
}
