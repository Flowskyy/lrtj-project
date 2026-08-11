import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { withActivityContextFromSession } from '@/lib/activity-middleware'
import { logManualActivity } from '@/lib/activity-logger'

// DELETE admin user
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

      const { id: userIdToDelete } = await params

      // Safety check: prevent deleting your own account
      if (session.user.id === userIdToDelete) {
        return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
      }

      // Check if user exists using raw SQL and fetch before state
      const user = await prisma.$queryRaw`
        SELECT id, name, email, roleId,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
        FROM auth_users WHERE id = ${userIdToDelete}
      ` as any[];

      if (!user || user.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const beforeState = user[0];

      // Delete user using raw SQL (auth_sessions and auth_accounts will be cascade deleted due to relations)
      await prisma.$queryRaw`
        DELETE FROM auth_users WHERE id = ${userIdToDelete}
      `;

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'auth_users',
        recordId: userIdToDelete,
        action: 'DELETE',
        beforeState,
      });

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error deleting admin user:", error)
      return NextResponse.json({ error: "Failed to delete admin user" }, { status: 500 })
    }
  });
}
