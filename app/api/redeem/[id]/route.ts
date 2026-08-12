import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const redeemId = parseInt(id);

    if (isNaN(redeemId)) {
      return NextResponse.json({ error: 'Invalid redeem ID' }, { status: 400 });
    }

    const redeem = await prisma.redeem.findUnique({
      where: { id: redeemId },
    });

    if (!redeem) {
      return NextResponse.json({ error: 'Redeem record not found' }, { status: 404 });
    }

    // Get merchandise name
    const merchandise = await prisma.merchandise.findUnique({
      where: { id: redeem.merchandise_id },
      select: { name: true },
    });

    const redeemWithMerchandise = {
      ...redeem,
      merchandise_name: merchandise?.name || 'This item has been deleted',
    };

    return NextResponse.json(redeemWithMerchandise);
  } catch (error) {
    console.error('Error fetching redeem record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redeem record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const { id } = await params;
      const redeemId = parseInt(id);

      if (isNaN(redeemId)) {
        return NextResponse.json({ error: 'Invalid redeem ID' }, { status: 400 });
      }

      // Fetch the before state
      const beforeRedeem = await prisma.$queryRaw`
        SELECT
          r.id, r.user_id, r.merchandise_id, r.receiver_name, r.receiver_phone, r.receiver_email, r.receiver_address, r.status, r.category_id,
          DATE_FORMAT(r.created_at, '%Y-%m-%dT%H:%i:%s') as createdAt,
          DATE_FORMAT(r.updated_at, '%Y-%m-%dT%H:%i:%s') as updatedAt,
          m.name as merchandise_name
        FROM redeem r
        LEFT JOIN merchandise m ON r.merchandise_id = m.id
        WHERE r.id = ${redeemId}
      ` as any[];

      if (!beforeRedeem || beforeRedeem.length === 0) {
        return NextResponse.json({ error: 'Redeem record not found' }, { status: 404 });
      }

      // Delete the redeem record
      await prisma.redeem.delete({
        where: { id: redeemId },
      });

      // Log the activity
      await logManualActivity({
        tableName: 'redeem',
        recordId: id,
        action: 'DELETE',
        beforeState: beforeRedeem[0],
      });

      return NextResponse.json({ message: 'Redeem record deleted successfully' });
    } catch (error) {
      console.error('Error deleting redeem record:', error);
      return NextResponse.json(
        { error: 'Failed to delete redeem record' },
        { status: 500 }
      );
    }
  });
}
