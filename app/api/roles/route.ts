import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatWIB } from "@/lib/utils"
import { withActivityContextFromSession } from '@/lib/activity-middleware'
import { logManualActivity } from '@/lib/activity-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100') // Higher default for roles
    const skip = (page - 1) * limit

    // Get total count
    const total = await prisma.$queryRaw`SELECT COUNT(*) as count FROM auth_roles` as any[];
    const count = Number(total[0]?.count || 0);

    // Get roles using raw SQL to avoid Prisma client issues
    const roles = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        isSuperAdmin,
        tier,
        showOnDashboard,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
      FROM auth_roles
      ORDER BY tier ASC
      LIMIT ${limit} OFFSET ${skip}
    ` as any[];

    // Get permission and user counts for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const permissionCount = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM role_permissions WHERE roleId = ${role.id}
        ` as any[];
        const userCount = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM auth_users WHERE roleId = ${role.id}
        ` as any[];
        return {
          ...role,
          _count: {
            role_permissions: Number(permissionCount[0]?.count || 0),
            auth_users: Number(userCount[0]?.count || 0)
          }
        };
      })
    );

    return NextResponse.json({
      roles: rolesWithCounts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const body = await request.json()
      const { name, isSuperAdmin, showOnDashboard, permissions } = body

      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Role name is required" }, { status: 400 })
      }

      // Check if role name already exists
      const existingRole = await prisma.$queryRaw`
        SELECT id FROM auth_roles WHERE name = ${name.trim()}
      ` as any[];

      if (existingRole && existingRole.length > 0) {
        return NextResponse.json({ error: "Role name already exists" }, { status: 400 })
      }

      const now = formatWIB(new Date());

      // Create role using raw SQL
      const result = await prisma.$queryRaw`
        INSERT INTO auth_roles (name, isSuperAdmin, showOnDashboard, createdAt, updatedAt)
        VALUES (${name.trim()}, ${isSuperAdmin || false}, ${showOnDashboard !== undefined ? showOnDashboard : true}, ${now}, ${now})
      ` as any[];

      // Get the inserted role ID
      const insertedRole = await prisma.$queryRaw`
        SELECT id, name, isSuperAdmin, showOnDashboard,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
        FROM auth_roles
        WHERE name = ${name.trim()}
      ` as any[];

      if (!insertedRole || insertedRole.length === 0) {
        return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
      }

      const newRole = insertedRole[0];

      // Create permissions if not super admin
      if (!isSuperAdmin && permissions && permissions.length > 0) {
        // Filter out disabled/unavailable permissions
        const validPermissions = permissions.filter((p: string) => p !== 'daily-benefit');
        
        for (const pageKey of validPermissions) {
          await prisma.$queryRaw`
            INSERT INTO role_permissions (roleId, pageKey, createdAt, updatedAt)
            VALUES (${newRole.id}, ${pageKey}, ${now}, ${now})
          `;
        }
      }

      // Delete all sessions for users with this role to force re-login
      // This handles the case where a role is created and immediately assigned to users
      await prisma.$queryRaw`
        DELETE FROM auth_sessions 
        WHERE userId IN (SELECT id FROM auth_users WHERE roleId = ${newRole.id})
      `;

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'auth_roles',
        recordId: String(newRole.id),
        action: 'CREATE',
        afterState: newRole,
      });

      return NextResponse.json(newRole, { status: 201 })
    } catch (error) {
      console.error("Error creating role:", error)
      return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
    }
  });
}
