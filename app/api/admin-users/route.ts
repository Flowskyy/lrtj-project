import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all admin users with roles and last online info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')

    // Get all users with their roles and most recent session
    const users = await prisma.auth_users.findMany({
      where: roleId ? { roleId: parseInt(roleId) } : undefined,
      include: {
        admin_roles: {
          select: {
            id: true,
            name: true,
          }
        },
        auth_sessions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            updatedAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform data to include last online from most recent session
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: user.admin_roles?.name || null,
      lastOnline: user.auth_sessions[0]?.updatedAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }))

    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return NextResponse.json({ error: "Failed to fetch admin users" }, { status: 500 })
  }
}
