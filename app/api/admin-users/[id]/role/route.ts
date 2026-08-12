import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { formatWIB, getWIBDate } from "@/lib/utils"

// PATCH admin user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userIdToUpdate } = await params
    const body = await request.json()
    const { roleId } = body

    if (!roleId || typeof roleId !== 'number') {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 })
    }

    // Safety check: prevent changing your own role
    if (session.user.id === userIdToUpdate) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
    }

    // Check if user exists using raw SQL
    const user = await prisma.$queryRaw`
      SELECT id, roleId FROM auth_users WHERE id = ${userIdToUpdate}
    ` as any[];

    if (!user || user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

     // Check if role exists using raw SQL
     const roleResult = await prisma.$queryRaw`
       SELECT id, name FROM auth_roles WHERE id = ${roleId}
     ` as any[];

     if (!roleResult || roleResult.length === 0) {
       return NextResponse.json({ error: "Role not found" }, { status: 404 })
     }

     const roleName = roleResult[0].name
     const oldRoleId = user[0].roleId

     // Update user's role using raw SQL
     const now = formatWIB(new Date());
     await prisma.$queryRaw`
       UPDATE auth_users SET roleId = ${roleId}, updatedAt = ${now} WHERE id = ${userIdToUpdate}
     `;

     const sessionRoleName = (session.user as any).role || 'Unknown'

     // Log activity
     await prisma.system_activity_logs.create({
       data: {
         tableName: 'auth_users',
         action: 'UPDATE',
         actorUserId: session.user.id,
         actorRoleName: sessionRoleName,
         actorRoleId: session.user.roleId || null,
         recordId: userIdToUpdate,
         beforeState: { roleId: oldRoleId },
         afterState: { roleId: roleId },
         changedFields: ['roleId'],
         createdAt: getWIBDate(),
       },
     })

     return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error changing admin user role:", error)
    return NextResponse.json({ error: "Failed to change admin user role" }, { status: 500 })
  }
}
