import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        provinces: true,
        regencies: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Manual join for membership only (no FK constraint per business decision)
    let membership = null;
    if (user.member_level_id) {
      membership = await prisma.membership.findUnique({
        where: { id: user.member_level_id },
      });
    }

    return NextResponse.json({
      ...user,
      province_name: user.provinces?.name || null,
      regency_name: user.regencies?.name || null,
      membership_name: membership?.name || null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for related records in critical business tables
    const [
      redeemCount,
      redeemBenefitCount,
      slcEarningCount,
      lrtjpEarningCount,
      tripHistoryCount,
    ] = await Promise.all([
      prisma.redeem.count({ where: { user_id: userId } }),
      prisma.redeem_benefit.count({ where: { user_id: userId } }),
      prisma.slc_earning_history.count({ where: { user_id: userId } }),
      prisma.lrtjp_earning_history.count({ where: { user_id: userId } }),
      prisma.trip_history.count({ where: { user_id: userId } }),
    ]);

    const hasRelatedRecords = redeemCount > 0 || redeemBenefitCount > 0 || 
                              slcEarningCount > 0 || lrtjpEarningCount > 0 || 
                              tripHistoryCount > 0;

    if (hasRelatedRecords) {
      const relatedData = [];
      if (redeemCount > 0) relatedData.push(`${redeemCount} merchandise redemption(s)`);
      if (redeemBenefitCount > 0) relatedData.push(`${redeemBenefitCount} benefit redemption(s)`);
      if (slcEarningCount > 0) relatedData.push(`${slcEarningCount} SLC earning record(s)`);
      if (lrtjpEarningCount > 0) relatedData.push(`${lrtjpEarningCount} LRTJ earning record(s)`);
      if (tripHistoryCount > 0) relatedData.push(`${tripHistoryCount} trip history record(s)`);

      return NextResponse.json({ 
        error: 'Cannot delete user with related records',
        details: `User has ${relatedData.join(', ')}. Please delete these records first or contact database administrator.`
      }, { status: 400 });
    }

    // Hard delete - permanently remove the user
    await prisma.users.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User permanently deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
