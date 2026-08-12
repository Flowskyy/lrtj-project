import { prisma, basePrismaClient } from './prisma'
import { getWIBDate } from './utils'
import { withActivityContext } from './activity-logger'
import { Prisma } from './generated/prisma'

// Sensitive fields that cannot be reverted (they contain "[REDACTED]" in logs)
const NON_REVERTIBLE_FIELDS = [
  'password',
  'otp',
  'otpCodeHash',
  'inviteTokenHash',
  'accessToken',
  'refreshToken',
  'idToken',
  'token',
  'auth_code',
  'value', // auth_verifications.value
  'lrtjpay_pin',
  'lrtj_token',
  'lrtjpay_token',
  'remember_token',
  'device_token',
  'google_id',
  'apple_id',
]

/**
 * Get the Prisma model for a given table name
 * Note: Since we're using an extended client, we access models dynamically
 */
function getModelForTable(tableName: string) {
  const modelMap: Record<string, keyof typeof prisma> = {
    'auth_users': 'auth_users',
    'auth_accounts': 'auth_accounts',
    'auth_sessions': 'auth_sessions',
    'auth_verifications': 'auth_verifications',
    'auth_roles': 'auth_roles',
    'admin_roles': 'admin_roles',
    'admin_permissions': 'admin_permissions',
    'admin_role_permissions': 'admin_role_permissions',
    'admin_invitations': 'admin_invitations',
    'admin_activity_logs': 'admin_activity_logs',
    'role_permissions': 'role_permissions',
    'merchandise': 'merchandise',
    'merchandise_category': 'merchandise_category',
    'daily_benefit': 'daily_benefit',
    'daily_reward': 'daily_reward',
    'daily_redem': 'daily_redem',
    'welcome_point': 'welcome_point',
    'popups': 'popups',
    'news': 'news',
    'banners': 'banners',
    'notifications': 'notifications',
    'stations': 'stations',
    'fare': 'fare',
    'users': 'users',
    'users_admin': 'users_admin',
    'users_temp': 'users_temp',
    'merchant': 'merchant',
    'membership': 'membership',
    'member_level': 'member_level',
    'provinces': 'provinces',
    'regencies': 'regencies',
    'term_condition': 'term_condition',
    'ticket': 'ticket',
    'ticket_detail': 'ticket_detail',
    'trip_history': 'trip_history',
    'history_redem_poin': 'history_redem_poin',
    'slc_earning_history': 'slc_earning_history',
    'lrtjp_earning_history': 'lrtjp_earning_history',
    'exports': 'exports',
    'imports': 'imports',
    'failed_import_rows': 'failed_import_rows',
    'notifications_read': 'notifications_read',
    'notifications_export': 'notifications_export',
    'password_reset_tokens': 'password_reset_tokens',
    'personal_access_tokens': 'personal_access_tokens',
    'model_has_permissions': 'model_has_permissions',
    'model_has_roles': 'model_has_roles',
    'permissions': 'permissions',
    'roles': 'roles',
    'role_has_permissions': 'role_has_permissions',
    'bayarind_binding_states': 'bayarind_binding_states',
    'bayarind_customer_tokens': 'bayarind_customer_tokens',
    'bayarind_qr_payment': 'bayarind_qr_payment',
    'bayarind_callback': 'bayarind_callback',
    'qris_tap_auth': 'qris_tap_auth',
    'qris_tap_capture': 'qris_tap_capture',
    'qris_tap_payment': 'qris_tap_payment',
    'dki_callback': 'dki_callback',
    'midtrans_transaction': 'midtrans_transaction',
    'activity_log': 'activity_log',
  }
  
  const modelKey = modelMap[tableName]
  if (!modelKey) {
    return null
  }
  
  return (prisma as any)[modelKey]
}

/**
 * Revert an activity log entry
 */
export async function revertActivityLog(
  logId: bigint,
  actorUserId: string,
  actorName: string,
  actorEmail: string,
  actorRoleId?: number,
  actorRoleName?: string
) {
  // Fetch the log entry using base client to avoid circular dependency
  const log = await basePrismaClient.system_activity_logs.findUnique({
    where: { id: logId },
  })

  if (!log) {
    throw new Error('Activity log entry not found')
  }

  // Check if already reverted
  if (log.revertedAt) {
    throw new Error('This change has already been reverted')
  }

  // Get the Prisma model for this table
  const model = getModelForTable(log.tableName)
  if (!model) {
    throw new Error(`Model not found for table: ${log.tableName}`)
  }

  // Handle different action types
  if (log.action === 'CREATE') {
    // Revert CREATE by deleting the record
    return await revertCreate(log, model, actorUserId, actorName, actorEmail, actorRoleId, actorRoleName)
  } else if (log.action === 'UPDATE') {
    // Revert UPDATE by restoring the before state
    return await revertUpdate(log, model, actorUserId, actorName, actorEmail, actorRoleId, actorRoleName)
  } else if (log.action === 'DELETE') {
    // Revert DELETE by recreating the record
    return await revertDelete(log, model, actorUserId, actorName, actorEmail, actorRoleId, actorRoleName)
  } else {
    throw new Error(`Unsupported action type: ${log.action}`)
  }
}

/**
 * Revert a CREATE action by deleting the record
 */
async function revertCreate(
  log: any,
  model: any,
  actorUserId: string,
  actorName: string,
  actorEmail: string,
  actorRoleId?: number,
  actorRoleName?: string
) {
  try {
    // Check if record still exists - need to handle potential string/number ID conversion
    const whereClause = isNaN(Number(log.recordId)) 
      ? { id: log.recordId }
      : { id: Number(log.recordId) }

    const existing = await model.findUnique({
      where: whereClause,
    })

    if (!existing) {
      throw new Error('Record no longer exists, cannot revert')
    }

    // Delete the record
    await model.delete({
      where: whereClause,
    })

    // Mark the log as reverted using base client to avoid circular dependency
    await basePrismaClient.system_activity_logs.update({
      where: { id: log.id },
      data: {
        revertedAt: getWIBDate(),
        revertedByUserId: actorUserId,
      },
    })

    // Log the revert action using base client to avoid circular dependency
    await basePrismaClient.system_activity_logs.create({
      data: {
        actorUserId,
        actorName,
        actorEmail,
        actorRoleId,
        actorRoleName,
        tableName: log.tableName,
        recordId: log.recordId,
        action: 'DELETE',
        beforeState: log.afterState, // The created record becomes the before state
        afterState: Prisma.DbNull,
        changedFields: Prisma.JsonNull,
        createdAt: getWIBDate(),
      },
    })

    return {
      success: true,
      message: `Successfully reverted CREATE by deleting record ${log.recordId}`,
      revertedRecordId: log.recordId,
    }
  } catch (error: any) {
    throw new Error(`Failed to revert CREATE: ${error.message}`)
  }
}

/**
 * Revert an UPDATE action by restoring the before state
 */
async function revertUpdate(
  log: any,
  model: any,
  actorUserId: string,
  actorName: string,
  actorEmail: string,
  actorRoleId?: number,
  actorRoleName?: string
) {
  try {
    // Handle ID conversion
    const whereClause = isNaN(Number(log.recordId)) 
      ? { id: log.recordId }
      : { id: Number(log.recordId) }

    // Check if record still exists
    const current = await model.findUnique({
      where: whereClause,
    })

    if (!current) {
      throw new Error('Record no longer exists, cannot revert')
    }

    // Check for stale conflicts - compare current state with expected after state
    if (log.afterState) {
      const currentFields = Object.keys(current).filter(k => k !== 'id')
      const afterFields = Object.keys(log.afterState).filter(k => k !== 'id')
      
      // Check if current state differs from what we expected
      let hasConflict = false
      const conflicts: string[] = []
      
      for (const field of currentFields) {
        if (afterFields.includes(field)) {
          if (JSON.stringify(current[field]) !== JSON.stringify(log.afterState[field])) {
            hasConflict = true
            conflicts.push(field)
          }
        }
      }
      
      if (hasConflict) {
        throw new Error(
          `Stale conflict detected. Record has been modified since this change. ` +
          `Conflicting fields: ${conflicts.join(', ')}. ` +
          `Cannot safely revert without data loss.`
        )
      }
    }

    // Filter out non-revertible fields from beforeState
    const revertData: any = {}
    const skippedFields: string[] = []
    
    if (log.beforeState) {
      for (const [key, value] of Object.entries(log.beforeState)) {
        if (NON_REVERTIBLE_FIELDS.includes(key)) {
          skippedFields.push(key)
        } else if (key !== 'id') {
          if ((key === 'createdAt' || key === 'updatedAt') && value) {
            revertData[key] = new Date(String(value).replace(' ', 'T'))
          } else {
            revertData[key] = value
          }
        }
      }
    }

    // Restore the before state
    await model.update({
      where: whereClause,
      data: revertData,
    })

    // Mark the log as reverted using base client to avoid circular dependency
    await basePrismaClient.system_activity_logs.update({
      where: { id: log.id },
      data: {
        revertedAt: getWIBDate(),
        revertedByUserId: actorUserId,
      },
    })

    // Log the revert action using base client to avoid circular dependency
    await basePrismaClient.system_activity_logs.create({
      data: {
        actorUserId,
        actorName,
        actorEmail,
        actorRoleId,
        actorRoleName,
        tableName: log.tableName,
        recordId: log.recordId,
        action: 'UPDATE',
        beforeState: current, // Current state before revert
        afterState: log.beforeState, // Reverted state
        changedFields: Object.keys(revertData) as Prisma.InputJsonValue,
        createdAt: getWIBDate(),
      },
    })

    return {
      success: true,
      message: `Successfully reverted UPDATE for record ${log.recordId}`,
      revertedRecordId: log.recordId,
      skippedFields: skippedFields.length > 0 ? skippedFields : undefined,
    }
  } catch (error: any) {
    throw new Error(`Failed to revert UPDATE: ${error.message}`)
  }
}

/**
 * Revert a DELETE action by recreating the record
 */
async function revertDelete(
  log: any,
  model: any,
  actorUserId: string,
  actorName: string,
  actorEmail: string,
  actorRoleId?: number,
  actorRoleName?: string
) {
  try {
    // Handle ID conversion - for recreation, we don't force the ID
    const whereClause = isNaN(Number(log.recordId)) 
      ? { id: log.recordId }
      : { id: Number(log.recordId) }

    // Check if record already exists (might have been recreated)
    const existing = await model.findUnique({
      where: whereClause,
    })

    if (existing) {
      throw new Error('Record already exists, cannot revert DELETE')
    }

    // Filter out non-revertible fields from beforeState
    const recreateData: any = {}
    const skippedFields: string[] = []
    
    if (log.beforeState) {
      for (const [key, value] of Object.entries(log.beforeState)) {
        if (NON_REVERTIBLE_FIELDS.includes(key)) {
          skippedFields.push(key)
        } else if (key === 'createdAt' || key === 'updatedAt') {
          if (value) recreateData[key] = new Date(String(value).replace(' ', 'T'))
        } else {
          recreateData[key] = value
        }
      }
    }

    // Recreate the record
    await model.create({
      data: recreateData,
    })

    // Mark the log as reverted using base client to avoid circular dependency
    await basePrismaClient.system_activity_logs.update({
      where: { id: log.id },
      data: {
        revertedAt: getWIBDate(),
        revertedByUserId: actorUserId,
      },
    })

    // Log the revert action using base client to avoid circular dependency
    await basePrismaClient.system_activity_logs.create({
      data: {
        actorUserId,
        actorName,
        actorEmail,
        actorRoleId,
        actorRoleName,
        tableName: log.tableName,
        recordId: log.recordId,
        action: 'CREATE',
        beforeState: Prisma.DbNull,
        afterState: log.beforeState,
        changedFields: Prisma.JsonNull,
        createdAt: getWIBDate(),
      },
    })

    return {
      success: true,
      message: `Successfully reverted DELETE by recreating record ${log.recordId}`,
      revertedRecordId: log.recordId,
      skippedFields: skippedFields.length > 0 ? skippedFields : undefined,
    }
  } catch (error: any) {
    throw new Error(`Failed to revert DELETE: ${error.message}`)
  }
}