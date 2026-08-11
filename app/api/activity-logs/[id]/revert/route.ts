import { NextRequest, NextResponse } from 'next/server'
import { withActivityContextFromSession } from '@/lib/activity-middleware'
import { revertActivityLog } from '@/lib/activity-revert'
import { prisma } from '@/lib/prisma'

/**
 * Revert an activity log entry
 * POST /api/activity-logs/[id]/revert
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
      // Check if user is authenticated
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check if user has permission to revert
      // Only super admins or users with specific revert permission can revert
      const user = await prisma.auth_users.findUnique({
        where: { id: userId },
        select: {
          roleId: true,
          auth_roles: {
            select: {
              isSuperAdmin: true,
            },
          },
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Check if user is super admin
      const isSuperAdmin = (user.auth_roles as any)?.isSuperAdmin ?? false

      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Only super admins can revert changes.' },
          { status: 403 }
        )
      }

      // Parse the log ID
      const logId = BigInt(params.id)

      // Perform the revert
      const result = await revertActivityLog(
        logId,
        userId,
        userName || '',
        userEmail || '',
        roleId,
        roleName
      )

      return NextResponse.json(result)
    })
  } catch (error: any) {
    console.error('Revert activity log error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to revert activity log' },
      { status: 500 }
    )
  }
}