import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

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
    const role = await prisma.$queryRaw`
      SELECT id FROM auth_roles WHERE id = ${roleId}
    ` as any[];

    if (!role || role.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Update user's role using raw SQL
    await prisma.$queryRaw`
      UPDATE auth_users SET roleId = ${roleId} WHERE id = ${userIdToUpdate}
    `;

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error changing admin user role:", error)
    return NextResponse.json({ error: "Failed to change admin user role" }, { status: 500 })
  }
}
