import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all roles with permission counts
export async function GET() {
  try {
    // Use raw SQL to bypass Prisma's timezone conversion
    const roles = await prisma.$queryRaw`
      SELECT
        id,
        name,
        isSuperAdmin,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
      FROM auth_roles
      ORDER BY id ASC
    ` as any[];

    // Get permission counts for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const countResult = await prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM role_permissions
          WHERE roleId = ${role.id}
        ` as any[];
        
        return {
          ...role,
          _count: {
            role_permissions: Number(countResult[0]?.count || 0)
          }
        };
      })
    );

    return NextResponse.json(rolesWithCounts);
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
    const existing = await prisma.$queryRaw`
      SELECT id FROM auth_roles WHERE name = ${name}
    ` as any[];

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 400 })
    }

    // Create role using raw SQL to bypass Prisma's timezone conversion
    const result = await prisma.$queryRaw`
      INSERT INTO auth_roles (name, isSuperAdmin, createdAt, updatedAt)
      VALUES (${name}, ${isSuperAdmin || false}, NOW(), NOW())
    ` as any[];

    // Get the inserted role
    const newRole = await prisma.$queryRaw`
      SELECT
        id,
        name,
        isSuperAdmin,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
      FROM auth_roles
      WHERE id = LAST_INSERT_ID()
    ` as any[];

    const role = newRole[0];

    // Add permissions if provided (unless super admin - they have all permissions by default)
    if (!isSuperAdmin && permissions && Array.isArray(permissions)) {
      for (const pageKey of permissions) {
        await prisma.$queryRaw`
          INSERT INTO role_permissions (roleId, pageKey, createdAt, updatedAt)
          VALUES (${role.id}, ${pageKey}, NOW(), NOW())
        `;
      }
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
  }
}
