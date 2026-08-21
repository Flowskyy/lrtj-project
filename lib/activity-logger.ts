import { PrismaClient, Prisma } from './generated/prisma'
import { getWIBDate } from './utils'
import { AsyncLocalStorage } from 'async_hooks'

// AsyncLocalStorage to pass user context through the extension call chain
const activityContext = new AsyncLocalStorage<{
  userId?: string
  userName?: string
  userEmail?: string
  roleId?: number
  roleName?: string
}>()

// Sensitive fields that should be redacted across all models
const SENSITIVE_FIELDS = [
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

// Tables to exclude from logging (to prevent infinite recursion)
const EXCLUDED_TABLES = [
  'system_activity_logs',
  'auth_sessions', // Session updates are too frequent and not useful to log
  'failed_jobs', // System-managed
  'job_batches', // System-managed
  'migrations', // System-managed
  'api_hits', // High-frequency system metrics
]

/**
 * Redact sensitive fields from an object
 */
function redactSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const redacted: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      redacted[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveFields(value)
    } else {
      redacted[key] = value
    }
  }
  return redacted
}

/**
 * Extract changed fields between two objects
 */
function getChangedFields(before: any, after: any): string[] | null {
  const changed: string[] = []
  
  if (!before || !after) return null
  
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  
  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key)
    }
  }
  
  // Return null instead of empty array for consistency
  return changed.length > 0 ? changed : null
}

/**
 * Get the table name from a Prisma model name
 */
function getTableName(modelName: string): string {
  // Handle special cases where model name differs from table name
  const modelToTableMap: Record<string, string> = {
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
  
  return modelToTableMap[modelName] || modelName
}

/**
 * Prisma Client Extension for activity logging
 * This replaces the deprecated $use middleware
 */
export const activityLoggerExtension = (prisma: PrismaClient) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // model is already a string (e.g., "User"), not an object with .name
          const modelName = model
          const tableName = getTableName(modelName)
          
          // Skip logging for excluded tables
          if (EXCLUDED_TABLES.includes(tableName)) {
            return query(args)
          }
          
          // Get current user context from AsyncLocalStorage
          const context = activityContext.getStore()
          const actorUserId = context?.userId
          const actorName = context?.userName
          const actorEmail = context?.userEmail
          const actorRoleId = context?.roleId
          const actorRoleName = context?.roleName
          
          let beforeState: any = null
          let afterState: any = null
          let action: string | null = null
          let recordId: string | null = null
          
          // Handle different operation types
          if (operation === 'create' || operation === 'createMany') {
            action = 'CREATE'
            
            // For create, we need to capture the result
            const result = await query(args)
            
            if (operation === 'create') {
              afterState = redactSensitiveFields(result)
              recordId = String((result as any).id || (result as any)[Object.keys(result as any)[0]])
            } else if (operation === 'createMany') {
              // For createMany, log as a single entry with summary
              afterState = { count: (result as any).count }
              recordId = 'bulk'
            }
            
            // Log the activity
            await logActivity({
              actorUserId,
              actorName,
              actorEmail,
              actorRoleId,
              actorRoleName,
              tableName,
              recordId: recordId || 'unknown',
              action,
              beforeState: null,
              afterState,
              changedFields: null,
            })
            
            return result
          }
          
          if (operation === 'update' || operation === 'updateMany') {
            action = 'UPDATE'
            
            // For update, fetch the before state first
            if (operation === 'update' && args.where) {
              try {
                const current = await (model as any).findUnique({
                  where: args.where,
                })
                beforeState = redactSensitiveFields(current)
                recordId = String(current?.id || current[Object.keys(current)[0]])
              } catch (e) {
                // Record might not exist, skip before state
              }
            }
            
            // Execute the update
            const result = await query(args)
            
            if (operation === 'update') {
              // Fetch the after state
              try {
                const updated = await (model as any).findUnique({
                  where: args.where,
                })
                afterState = redactSensitiveFields(updated)
                recordId = String(updated?.id || updated[Object.keys(updated)[0]])
              } catch (e) {
                // Record might not exist after update
              }
            } else if (operation === 'updateMany') {
              afterState = { count: (result as any).count }
              recordId = 'bulk'
            }
            
            // Calculate changed fields
            const changedFields = beforeState && afterState ? getChangedFields(beforeState, afterState) : null
            
            // Log the activity
            await logActivity({
              actorUserId,
              actorName,
              actorEmail,
              actorRoleId,
              actorRoleName,
              tableName,
              recordId: recordId || 'unknown',
              action,
              beforeState,
              afterState,
              changedFields,
            })
            
            return result
          }
          
          if (operation === 'delete' || operation === 'deleteMany') {
            action = 'DELETE'
            
            // For delete, fetch the before state first
            if (operation === 'delete' && args.where) {
              try {
                const current = await (model as any).findUnique({
                  where: args.where,
                })
                beforeState = redactSensitiveFields(current)
                recordId = String(current?.id || current[Object.keys(current)[0]])
              } catch (e) {
                // Record might not exist, skip before state
              }
            }
            
            // Execute the delete
            const result = await query(args)
            
            if (operation === 'deleteMany') {
              beforeState = { count: (result as any).count }
              recordId = 'bulk'
            }
            
            // Log the activity
            await logActivity({
              actorUserId,
              actorName,
              actorEmail,
              actorRoleId,
              actorRoleName,
              tableName,
              recordId: recordId || 'unknown',
              action,
              beforeState,
              afterState: null,
              changedFields: null,
            })
            
            return result
          }
          
          // For all other operations, just pass through
          return query(args)
        },
      },
    },
  })
}

/**
 * Log activity to the database
 */
export async function logActivity(data: {
  actorUserId?: string
  actorName?: string
  actorEmail?: string
  actorRoleId?: number
  actorRoleName?: string
  tableName: string
  recordId: string
  action: string
  beforeState: any
  afterState: any
  changedFields: string[] | null
}) {
  try {
    // Use base client without extension to avoid circular dependency
    const { getBasePrismaClient } = await import('./prisma')
    const basePrismaClient = getBasePrismaClient()
    
    const result = await basePrismaClient.system_activity_logs.create({
      data: {
        actorUserId: data.actorUserId,
        actorName: data.actorName,
        actorEmail: data.actorEmail,
        actorRoleId: data.actorRoleId,
        actorRoleName: data.actorRoleName,
        tableName: data.tableName,
        recordId: data.recordId,
        action: data.action,
        beforeState: data.beforeState,
        afterState: data.afterState,
        changedFields: data.changedFields === null ? Prisma.JsonNull : data.changedFields as Prisma.InputJsonValue,
        createdAt: getWIBDate(),
      },
    })
  } catch (error) {
    // Don't throw errors from logging to avoid breaking the main operation
    console.error('Failed to log activity:', error)
  }
}

/**
 * Set the current user context for activity logging
 * This should be called at the beginning of each request/operation
 */
export function setActivityContext(context: {
  userId?: string
  userName?: string
  userEmail?: string
  roleId?: number
  roleName?: string
}) {
  return activityContext.run(context, () => {})
}

/**
 * Run a function with activity context
 */
export function withActivityContext<T>(
  context: {
    userId?: string
    userName?: string
    userEmail?: string
    roleId?: number
    roleName?: string
  },
  fn: () => Promise<T>
): Promise<T> {
  return activityContext.run(context, fn)
}

/**
 * Get the current activity context
 */
export function getActivityContext() {
  return activityContext.getStore()
}

/**
 * Manual activity logging helper for API routes that use raw SQL
 * This should be called directly in API routes when not using Prisma client methods
 */
export async function logManualActivity(params: {
  tableName: string
  recordId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  beforeState?: any
  afterState?: any
  changedFields?: string[]
}) {
  const context = activityContext.getStore()
  
  return logActivity({
    actorUserId: context?.userId,
    actorName: context?.userName,
    actorEmail: context?.userEmail,
    actorRoleId: context?.roleId,
    actorRoleName: context?.roleName,
    tableName: params.tableName,
    recordId: params.recordId,
    action: params.action,
    beforeState: params.beforeState || null,
    afterState: params.afterState || null,
    changedFields: params.changedFields || null,
  })
}