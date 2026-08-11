import { withActivityContext } from './activity-logger'
import { getSessionWithUser } from './auth'
import { prisma } from './prisma'

/**
 * API route middleware to set activity context from authenticated session
 * Call this at the beginning of any API route that performs database operations
 */
export async function withActivityContextFromSession<T>(
  handler: (userId: string, userName: string, userEmail: string, roleId?: number, roleName?: string) => Promise<T>
): Promise<T> {
  const session = await getSessionWithUser()
  
  if (!session?.user) {
    // No session, run without activity context
    return handler('', '', '', undefined, undefined)
  }
  
  const userId = session.user.id
  const userName = session.user.name || ''
  const userEmail = session.user.email || ''
  const roleId = session.user.roleId ?? undefined
  let roleName: string | undefined = undefined
  
  // Fetch role name if roleId exists
  if (roleId) {
    try {
      const role = await prisma.auth_roles.findUnique({
        where: { id: roleId },
        select: { name: true }
      })
      roleName = role?.name || undefined
    } catch (error) {
      console.error('Failed to fetch role name:', error)
    }
  }
  
  return withActivityContext(
    { userId, userName, userEmail, roleId, roleName },
    async () => handler(userId, userName, userEmail, roleId, roleName)
  )
}

/**
 * Helper to run a function with activity context for a specific user
 * Use this when you need to perform operations on behalf of a user
 */
export async function runAsUser<T>(
  userId: string,
  userName: string,
  userEmail: string,
  fn: () => Promise<T>,
  roleId?: number,
  roleName?: string
): Promise<T> {
  return withActivityContext({ userId, userName, userEmail, roleId, roleName }, fn)
}