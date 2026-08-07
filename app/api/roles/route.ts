import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"

const prisma = new PrismaClient()

// GET all roles with permission counts
export async function GET() {
  try {
    const roles = await prisma.auth_roles.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { role_permissions: true }
        }
      }
    })
    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

// POST create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, isSuperAdmin, permissions } = body

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    // Check if role name already exists
    const existing = await prisma.auth_roles.findUnique({
      where: { name }
    })

    if (existing) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 400 })
    }

    // Create role
    const role = await prisma.auth_roles.create({
      data: {
        name,
        isSuperAdmin: isSuperAdmin || false,
        updatedAt: new Date()
      }
    })

    // Add permissions if provided (unless super admin - they have all permissions by default)
    if (!isSuperAdmin && permissions && Array.isArray(permissions)) {
      await prisma.role_permissions.createMany({
        data: permissions.map((pageKey: string) => ({
          roleId: role.id,
          pageKey
        }))
      })
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
  }
}
