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
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const { id } = await params;
      const userIdNum = parseInt(id);

      if (isNaN(userIdNum)) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
      }

      const body = await request.json();
      const { activation_slc, activation_slc_at, activation_lrtjpay, activation_lrtjpay_at } = body;

      // Fetch the before state
      const beforeItem = await prisma.$queryRawUnsafe(
        `SELECT id, activation_slc, DATE_FORMAT(activation_slc_at, '%Y-%m-%dT%H:%i:%s') as activation_slc_at,
         activation_lrtjpay, DATE_FORMAT(activation_lrtjpay_at, '%Y-%m-%dT%H:%i:%s') as activation_lrtjpay_at
         FROM users WHERE id = ?`,
        userIdNum
      ) as any[];

      if (!beforeItem || beforeItem.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Build update query dynamically based on provided fields
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      // Prevent activation from admin panel - only allow deactivation
      if (activation_slc !== undefined) {
        if (activation_slc === 1) {
          return NextResponse.json({ 
            error: 'Activation is not allowed from admin panel. Users must activate LarataClub via the mobile app.' 
          }, { status: 403 });
        }
        // Only allow deactivation (setting to 0)
        updateFields.push('activation_slc = ?');
        updateValues.push(0);
      }

      if (activation_slc_at !== undefined) {
        // Only allow setting to null (deactivation)
        if (activation_slc_at !== null) {
          return NextResponse.json({ 
            error: 'Setting activation timestamp is not allowed from admin panel. Users must activate LarataClub via the mobile app.' 
          }, { status: 403 });
        }
        updateFields.push('activation_slc_at = NULL');
      }

      if (activation_lrtjpay !== undefined) {
        if (activation_lrtjpay === 1) {
          return NextResponse.json({ 
            error: 'Activation is not allowed from admin panel. Users must activate LarataPay via the mobile app.' 
          }, { status: 403 });
        }
        // Only allow deactivation (setting to 0)
        updateFields.push('activation_lrtjpay = ?');
        updateValues.push(0);
      }

      if (activation_lrtjpay_at !== undefined) {
        // Only allow setting to null (deactivation)
        if (activation_lrtjpay_at !== null) {
          return NextResponse.json({ 
            error: 'Setting activation timestamp is not allowed from admin panel. Users must activate LarataPay via the mobile app.' 
          }, { status: 403 });
        }
        updateFields.push('activation_lrtjpay_at = NULL');
      }

      // Check if deactivating LarataPay
      const isDeactivatingLrtjPay = (activation_lrtjpay === 0) || (activation_lrtjpay_at === null);

      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
      }

      // Add userId to the end for WHERE clause
      updateValues.push(userIdNum);

      const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

      // Run update and token deletion in a transaction
      await prisma.$transaction(async (tx) => {
        await tx.$queryRawUnsafe(updateQuery, ...updateValues);

        // If deactivating LarataPay, also delete the corresponding bayarind_customer_tokens row
        if (isDeactivatingLrtjPay) {
          await tx.bayarind_customer_tokens.deleteMany({
            where: { user_id: BigInt(userIdNum) },
          });
        }
      });

      // Fetch the after state
      const afterItem = await prisma.$queryRawUnsafe(
        `SELECT id, activation_slc, DATE_FORMAT(activation_slc_at, '%Y-%m-%dT%H:%i:%s') as activation_slc_at,
         activation_lrtjpay, DATE_FORMAT(activation_lrtjpay_at, '%Y-%m-%dT%H:%i:%s') as activation_lrtjpay_at
         FROM users WHERE id = ?`,
        userIdNum
      ) as any[];

      // Determine changed fields
      const changedFields = Object.keys(beforeItem[0]).filter(key => {
        const beforeVal = beforeItem[0][key];
        const afterVal = afterItem[0][key];
        return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
      });

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'users',
        recordId: String(userIdNum),
        action: 'UPDATE',
        beforeState: beforeItem[0],
        afterState: afterItem[0],
        changedFields: changedFields.length > 0 ? changedFields : undefined,
      });

      return NextResponse.json(afterItem[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';
    
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
      bayarindTokensCount,
    ] = await Promise.all([
      prisma.redeem.count({ where: { user_id: userId } }),
      prisma.redeem_benefit.count({ where: { user_id: userId } }),
      prisma.slc_earning_history.count({ where: { user_id: userId } }),
      prisma.lrtjp_earning_history.count({ where: { user_id: userId } }),
      prisma.trip_history.count({ where: { user_id: userId } }),
      prisma.bayarind_customer_tokens.count({ where: { user_id: BigInt(userId) } }),
    ]);

    const hasRelatedRecords = redeemCount > 0 || redeemBenefitCount > 0 || 
                              slcEarningCount > 0 || lrtjpEarningCount > 0 || 
                              tripHistoryCount > 0 || bayarindTokensCount > 0;

    if (hasRelatedRecords && !forceDelete) {
      const relatedData = [];
      
      // Helper function to convert BigInt to string for JSON serialization
      const convertBigIntToString = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(convertBigIntToString);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = convertBigIntToString(obj[key]);
          }
          return result;
        }
        return obj;
      };
      
      // Helper function to get table display name and fetch preview data
      const getTableInfo = async (tableName: string, count: number, userId: number) => {
        let displayName = tableName;
        let previewData: any[] = [];
        
        switch (tableName) {
          case 'merchandise redemption':
            displayName = 'Merchandise Redemption';
            // Fetch preview: merchandise_id, receiver_name, status, createdAt
            const redeemPreview = await prisma.$queryRawUnsafe(
              `SELECT id, merchandise_id, receiver_name, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at 
               FROM redeem WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`,
              userId
            ) as any[];
            previewData = convertBigIntToString(redeemPreview);
            break;
            
          case 'benefit redemption':
            displayName = 'Benefit Redemption';
            // Fetch preview: merchant_id, name, status, created_at
            const benefitPreview = await prisma.$queryRawUnsafe(
              `SELECT id, merchant_id, name, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at 
               FROM redeem_benefit WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`,
              userId
            ) as any[];
            previewData = convertBigIntToString(benefitPreview);
            break;
            
          case 'SLC earning record':
            displayName = 'LarataClub History';
            // Fetch preview: info, earning_point, category, created_at, type
            const slcPreview = await prisma.$queryRawUnsafe(
              `SELECT id, info, earning_point, category, type, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at 
               FROM slc_earning_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`,
              userId
            ) as any[];
            previewData = convertBigIntToString(slcPreview);
            break;
            
          case 'LRTJ earning record':
            displayName = 'LarataPay History';
            // Fetch preview: info, earning_point, category, created_at
            const lrtjPreview = await prisma.$queryRawUnsafe(
              `SELECT id, info, earning_point, category, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at 
               FROM lrtjp_earning_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`,
              userId
            ) as any[];
            previewData = convertBigIntToString(lrtjPreview);
            break;
            
          case 'trip history record':
            displayName = 'Trip History';
            // Fetch preview: station_in, station_out, station_in_at, station_out_at, created_at
            const tripPreview = await prisma.$queryRawUnsafe(
              `SELECT id, station_in, station_out, DATE_FORMAT(station_in_at, '%Y-%m-%d %H:%i') as station_in_at, 
               DATE_FORMAT(station_out_at, '%Y-%m-%d %H:%i') as station_out_at, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at 
               FROM trip_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`,
              userId
            ) as any[];
            previewData = convertBigIntToString(tripPreview);
            break;

          case 'LarataPay access token':
            displayName = 'LarataPay Access Tokens';
            // Fetch preview: customer_id, phone_number, token_type, expires_at, created_at
            const tokenPreview = await prisma.$queryRawUnsafe(
              `SELECT id, customer_id, phone_number, token_type, DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i') as expires_at, 
               DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at 
               FROM bayarind_customer_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`,
              BigInt(userId)
            ) as any[];
            previewData = convertBigIntToString(tokenPreview);
            break;
        }
        
        return { table: displayName, count, originalTable: tableName, preview: previewData };
      };
      
      if (redeemCount > 0) {
        relatedData.push(await getTableInfo('merchandise redemption', redeemCount, userId));
      }
      if (redeemBenefitCount > 0) {
        relatedData.push(await getTableInfo('benefit redemption', redeemBenefitCount, userId));
      }
      if (slcEarningCount > 0) {
        relatedData.push(await getTableInfo('SLC earning record', slcEarningCount, userId));
      }
      if (lrtjpEarningCount > 0) {
        relatedData.push(await getTableInfo('LRTJ earning record', lrtjpEarningCount, userId));
      }
      if (tripHistoryCount > 0) {
        relatedData.push(await getTableInfo('trip history record', tripHistoryCount, userId));
      }
      if (bayarindTokensCount > 0) {
        relatedData.push(await getTableInfo('LarataPay access token', bayarindTokensCount, userId));
      }

      return NextResponse.json({ 
        hasRelatedRecords: true,
        relatedData,
        message: 'User has related records that will be permanently deleted.'
      }, { status: 200 });
    }

    // Hard delete - permanently remove the user (with or without force flag)
    // If force delete, first delete all related records
    if (forceDelete && hasRelatedRecords) {
      // Delete related records in reverse dependency order
      await prisma.$transaction(async (tx) => {
        // Delete LarataPay access tokens
        if (bayarindTokensCount > 0) {
          await tx.bayarind_customer_tokens.deleteMany({ where: { user_id: BigInt(userId) } });
        }
        // Delete trip history
        if (tripHistoryCount > 0) {
          await tx.trip_history.deleteMany({ where: { user_id: userId } });
        }
        // Delete LRTJ earning history
        if (lrtjpEarningCount > 0) {
          await tx.lrtjp_earning_history.deleteMany({ where: { user_id: userId } });
        }
        // Delete SLC earning history
        if (slcEarningCount > 0) {
          await tx.slc_earning_history.deleteMany({ where: { user_id: userId } });
        }
        // Delete benefit redemptions
        if (redeemBenefitCount > 0) {
          await tx.redeem_benefit.deleteMany({ where: { user_id: userId } });
        }
        // Delete merchandise redemptions
        if (redeemCount > 0) {
          await tx.redeem.deleteMany({ where: { user_id: userId } });
        }
        // Finally delete the user
        await tx.users.delete({
          where: { id: userId },
        });
      });
    } else {
      // Normal delete without related records - still delete bayarind tokens if any
      await prisma.$transaction(async (tx) => {
        // Always delete LarataPay access tokens (does nothing if none exist)
        await tx.bayarind_customer_tokens.deleteMany({ where: { user_id: BigInt(userId) } });
        // Delete the user
        await tx.users.delete({
          where: { id: userId },
        });
      });
    }

    return NextResponse.json({ message: 'User permanently deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
