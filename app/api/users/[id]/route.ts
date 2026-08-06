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

    // Use raw SQL for consistent WIB formatting
    const user = await prisma.$queryRawUnsafe(
      `SELECT
        id, email, password, no_telepon, jenis_kelamin, nik, alamat, tempat_lahir, name, image, status, device_token,
        push_notification, email_notification, new_content_notification, google_id, otp, DATE_FORMAT(verified_at, '%Y-%m-%dT%H:%i:%s') as verified_at, activation_slc,
        DATE_FORMAT(activation_slc_at, '%Y-%m-%dT%H:%i:%s') as activation_slc_at, activation_lrtjpay,
        DATE_FORMAT(activation_lrtjpay_at, '%Y-%m-%dT%H:%i:%s') as activation_lrtjpay_at, member_level_id, apple_id, lrtj_token, guid,
        domain, lrtjpay_token, lrtjpay_pin, province_id, regency_id, ecard, ecard2, lrtj_saldo, slc_point, trip_count,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM users
      WHERE id = ?`,
      userId
    ) as any[];

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];

    // Manual joins for provinces, regencies, and membership (no FK constraints per business decision)
    let province = null;
    let regency = null;
    let membership = null;

    if (userData.province_id) {
      province = await prisma.provinces.findUnique({
        where: { id: Number(userData.province_id) },
      });
    }
    if (userData.regency_id) {
      regency = await prisma.regencies.findUnique({
        where: { id: Number(userData.regency_id) },
      });
    }
    if (userData.member_level_id) {
      membership = await prisma.membership.findUnique({
        where: { id: Number(userData.member_level_id) },
      });
    }

    return NextResponse.json({
      ...userData,
      province_id: userData.province_id ? Number(userData.province_id) : null,
      regency_id: userData.regency_id ? Number(userData.regency_id) : null,
      member_level_id: userData.member_level_id ? Number(userData.member_level_id) : null,
      province_name: province?.name || null,
      regency_name: regency?.name || null,
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
