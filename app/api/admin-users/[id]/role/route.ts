import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { formatWIB, getWIBDate } from "@/lib/utils"
import { withActivityContextFromSession } from '@/lib/activity-middleware'
import { logManualActivity } from '@/lib/activity-logger'

// PATCH admin user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const session = await getSession()
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { id: userIdToUpdate } = await params
      const body = await request.json()
      const { roleId: newRoleId } = body

      if (!newRoleId || typeof newRoleId !== 'number') {
        return NextResponse.json({ error: "Invalid role ID" }, { status: 400 })
      }

      // Safety check: prevent changing your own role
      if (session.user.id === userIdToUpdate) {
        return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
      }

      // Check if user exists using raw SQL
      const user = await prisma.$queryRaw`
        SELECT id, roleId, name, email,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
        FROM auth_users WHERE id = ${userIdToUpdate}
      ` as any[];

      if (!user || user.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Check if role exists using raw SQL
      const roleResult = await prisma.$queryRaw`
        SELECT id, name FROM auth_roles WHERE id = ${newRoleId}
      ` as any[];

      if (!roleResult || roleResult.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 })
      }

      const oldRoleId = user[0].roleId
      const beforeState = user[0]

      // Update user's role using raw SQL
      const now = formatWIB(new Date());
      await prisma.$queryRaw`
        UPDATE auth_users SET roleId = ${newRoleId}, updatedAt = ${now} WHERE id = ${userIdToUpdate}
      `;

      // Fetch updated user for after state
      const updatedUser = await prisma.$queryRaw`
        SELECT id, roleId, name, email,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
        FROM auth_users WHERE id = ${userIdToUpdate}
      ` as any[];

      const afterState = updatedUser[0]

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'auth_users',
        recordId: userIdToUpdate,
        action: 'UPDATE',
        beforeState,
        afterState,
        changedFields: ['roleId'],
      });

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error changing admin user role:", error)
      return NextResponse.json({ error: "Failed to change admin user role" }, { status: 500 })
    }
  });
}

// DELETE admin user role (kick action)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const session = await getSession()
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { id: userIdToUpdate } = await params

      // Safety check: prevent removing your own role
      if (session.user.id === userIdToUpdate) {
        return NextResponse.json({ error: "Cannot remove your own role" }, { status: 400 })
      }

      // Check if user exists using raw SQL
      const user = await prisma.$queryRaw`
        SELECT id, roleId, name, email,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
        FROM auth_users WHERE id = ${userIdToUpdate}
      ` as any[];

      if (!user || user.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const beforeState = user[0]

      // Update user's role to null using raw SQL
      const now = formatWIB(new Date());
      await prisma.$queryRaw`
        UPDATE auth_users SET roleId = NULL, updatedAt = ${now} WHERE id = ${userIdToUpdate}
      `;

      // Delete all sessions for this user to force re-login
      await prisma.$queryRaw`
        DELETE FROM auth_sessions WHERE userId = ${userIdToUpdate}
      `;

      // Fetch updated user for after state
      const updatedUser = await prisma.$queryRaw`
        SELECT id, roleId, name, email,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
        FROM auth_users WHERE id = ${userIdToUpdate}
      ` as any[];

      const afterState = updatedUser[0]

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'auth_users',
        recordId: userIdToUpdate,
        action: 'UPDATE',
        beforeState,
        afterState,
        changedFields: ['roleId'],
      });

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error removing admin user role:", error)
      return NextResponse.json({ error: "Failed to remove admin user role" }, { status: 500 })
    }
  });
}
