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
    const banner = await prisma.banners.findUnique({
      where: { id: parseInt(id) },
    });

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
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
      const beforeBanner = await prisma.$queryRaw`
        SELECT
          id, description, image_url, sequence, created_by,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM banners
        WHERE id = ${parseInt(id)}
      ` as any[];

      if (!beforeBanner || beforeBanner.length === 0) {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        );
      }

      const banner = await prisma.banners.update({
        where: { id: parseInt(id) },
        data: {
          description: description || null,
          image_url,
          updated_at: new Date(),
          updated_by: session?.user?.name || null,
        },
      });

      // Fetch the after state
      const afterBanner = await prisma.$queryRaw`
        SELECT
          id, description, image_url, sequence, created_by,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM banners
        WHERE id = ${parseInt(id)}
      ` as any[];

      // Calculate changed fields
      const changedFields = Object.keys(body).filter(key => {
        const beforeVal = beforeBanner[0][key];
        const afterVal = afterBanner[0][key];
        return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
      });

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'banners',
        recordId: id,
        action: 'UPDATE',
        beforeState: beforeBanner[0],
        afterState: afterBanner[0],
        changedFields,
      });

      return NextResponse.json(banner);
    } catch (error) {
      console.error('Error updating banner:', error);
      return NextResponse.json(
        { error: 'Failed to update banner' },
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
      const beforeBanner = await prisma.$queryRaw`
        SELECT
          id, description, image_url, sequence, created_by,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM banners
        WHERE id = ${parseInt(id)}
      ` as any[];

      if (!beforeBanner || beforeBanner.length === 0) {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        );
      }

      // Get the sequence of the banner being deleted
      const deletedBanner = await prisma.banners.findUnique({
        where: { id: parseInt(id) },
        select: { sequence: true },
      });

      // Delete the banner
      await prisma.banners.delete({
        where: { id: parseInt(id) },
      });

      // Re-sequence remaining banners to keep them contiguous
      const remainingBanners = await prisma.banners.findMany({
        where: { sequence: { gt: deletedBanner.sequence } },
        orderBy: { sequence: 'asc' },
      });

      // Update sequence values in a transaction
      await prisma.$transaction(
        remainingBanners.map((banner) =>
          prisma.banners.update({
            where: { id: banner.id },
            data: { sequence: banner.sequence - 1 },
          })
        )
      );

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'banners',
        recordId: id,
        action: 'DELETE',
        beforeState: beforeBanner[0],
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting banner:', error);
      return NextResponse.json(
        { error: 'Failed to delete banner' },
        { status: 500 }
      );
    }
  });
}
