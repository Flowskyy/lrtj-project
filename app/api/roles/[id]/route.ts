import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatWIB } from "@/lib/utils"
import { withActivityContextFromSession } from '@/lib/activity-middleware'
import { logManualActivity } from '@/lib/activity-logger'

// GET single role with permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get role using raw SQL to bypass Prisma's timezone conversion
    const roles = await prisma.$queryRaw`
      SELECT
        id,
        name,
        isSuperAdmin,
        showOnDashboard,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
      FROM auth_roles
      WHERE id = ${parseInt(id)}
    ` as any[];

    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    const role = roles[0];

    // Get permissions
    const permissions = await prisma.$queryRaw`
      SELECT id, pageKey
      FROM role_permissions
      WHERE roleId = ${parseInt(id)}
    ` as any[];

    // Get user count
    const userCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM auth_users
      WHERE roleId = ${parseInt(id)}
    ` as any[];

    const roleWithDetails = {
      ...role,
      role_permissions: permissions,
      _count: {
        auth_users: Number(userCountResult[0]?.count || 0)
      }
    };

    return NextResponse.json(roleWithDetails)
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
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { name, isSuperAdmin, showOnDashboard, permissions } = body

      // Check if role exists and fetch before state
      const existing = await prisma.$queryRaw`
        SELECT id, name, isSuperAdmin, showOnDashboard,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
        FROM auth_roles
        WHERE id = ${parseInt(id)}
      ` as any[];

      if (!existing || existing.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 })
      }

      const role = existing[0];

      // Check if new name conflicts with existing role
      if (name && name !== role.name) {
        const nameConflict = await prisma.$queryRaw`
          SELECT id FROM auth_roles WHERE name = ${name} AND id != ${parseInt(id)}
        ` as any[];
        
        if (nameConflict && nameConflict.length > 0) {
          return NextResponse.json({ error: "Role name already exists" }, { status: 400 })
        }
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      if (name) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      
      if (isSuperAdmin !== undefined) {
        updateFields.push('isSuperAdmin = ?');
        updateValues.push(isSuperAdmin);
      }
      
      if (showOnDashboard !== undefined) {
        updateFields.push('showOnDashboard = ?');
        updateValues.push(showOnDashboard);
      }
      
      // Always update updatedAt with WIB time
      const now = formatWIB(new Date());
      updateFields.push('updatedAt = ?');
      updateValues.push(now);
      
      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE auth_roles
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;
        updateValues.push(parseInt(id));
        
        await prisma.$queryRawUnsafe(updateQuery, ...updateValues);
      }

      // Update permissions (delete all and recreate) unless super admin
      if (!isSuperAdmin && permissions !== undefined) {
        await prisma.$queryRaw`
          DELETE FROM role_permissions WHERE roleId = ${parseInt(id)}
        `;

        if (permissions.length > 0) {
          const now = formatWIB(new Date());
          for (const pageKey of permissions) {
            await prisma.$queryRaw`
              INSERT INTO role_permissions (roleId, pageKey, createdAt, updatedAt)
              VALUES (${parseInt(id)}, ${pageKey}, ${now}, ${now})
            `;
          }
        }
      }

      // Fetch updated role
      const updatedRoles = await prisma.$queryRaw`
        SELECT
          id,
          name,
          isSuperAdmin,
          DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
          DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
        FROM auth_roles
        WHERE id = ${parseInt(id)}
      ` as any[];

      // Calculate changed fields
      const changedFields = Object.keys(body).filter(key => {
        const beforeVal = role[key];
        const afterVal = updatedRoles[0][key];
        return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
      });

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'auth_roles',
        recordId: id,
        action: 'UPDATE',
        beforeState: role,
        afterState: updatedRoles[0],
        changedFields,
      });

      return NextResponse.json(updatedRoles[0])
    } catch (error) {
      console.error("Error updating role:", error)
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
    }
  });
}

// DELETE role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const { id } = await params
      const roleId = parseInt(id)

      // Fetch the before state
      const beforeRole = await prisma.$queryRaw`
        SELECT id, name, isSuperAdmin,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
        FROM auth_roles
        WHERE id = ${roleId}
      ` as any[];

      if (!beforeRole || beforeRole.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 })
      }

      // Check if role has users using raw SQL
      const userCountResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM auth_users
        WHERE roleId = ${roleId}
      ` as any[];

      const userCount = Number(userCountResult[0]?.count || 0);

      if (userCount > 0) {
        return NextResponse.json(
          { error: `Cannot delete role: ${userCount} user(s) are assigned to this role` },
          { status: 400 }
        )
      }

      // Delete role using raw SQL (cascade will delete permissions)
      await prisma.$queryRaw`
        DELETE FROM auth_roles WHERE id = ${roleId}
      `;

      // Log the activity manually since we're using raw SQL
      await logManualActivity({
        tableName: 'auth_roles',
        recordId: id,
        action: 'DELETE',
        beforeState: beforeRole[0],
      });

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error deleting role:", error)
      return NextResponse.json({ error: "Failed to delete role" }, { status: 500 })
    }
  });
}
