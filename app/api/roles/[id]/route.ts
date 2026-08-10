import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"

const prisma = new PrismaClient()

// GET single role with permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const role = await prisma.auth_roles.findUnique({
      where: { id: parseInt(id) },
      include: {
        role_permissions: true,
        _count: {
          select: { auth_users: true }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 })
  }
}

// PUT update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, isSuperAdmin, permissions } = body

    const role = await prisma.auth_roles.findUnique({
      where: { id: parseInt(id) }
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existing = await prisma.auth_roles.findUnique({
        where: { name }
      })
      if (existing) {
        return NextResponse.json({ error: "Role name already exists" }, { status: 400 })
      }
    }

    // Update role
    const updatedRole = await prisma.auth_roles.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(isSuperAdmin !== undefined && { isSuperAdmin })
      }
    })

    // Update permissions (delete all and recreate) unless super admin
    if (!isSuperAdmin && permissions !== undefined) {
      await prisma.role_permissions.deleteMany({
        where: { roleId: parseInt(id) }
      })

      if (permissions.length > 0) {
        await prisma.role_permissions.createMany({
          data: permissions.map((pageKey: string) => ({
            roleId: parseInt(id),
            pageKey
          }))
        })
      }
    }

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}

// DELETE role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const roleId = parseInt(id)

    // Check if role has users
    const userCount = await prisma.auth_users.count({
      where: { roleId }
    })

    if (userCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete role: ${userCount} user(s) are assigned to this role` },
        { status: 400 }
      )
    }

    // Delete role (cascade will delete permissions)
    await prisma.auth_roles.delete({
      where: { id: roleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 })
  }
}
