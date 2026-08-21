import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';
import { formatWIB } from '@/lib/utils';

export async function PATCH(request: Request) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      const body = await request.json();
      const { items } = body;

      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Invalid request: items array is required' },
          { status: 400 }
        );
      }

      // Check if user is Super Admin for authorization
      const currentUserRole = await prisma.$queryRaw`
        SELECT tier, isSuperAdmin 
        FROM auth_roles 
        WHERE id = ${roleId}
      ` as any[];

      if (!currentUserRole || currentUserRole.length === 0) {
        return NextResponse.json(
          { error: 'User role not found' },
          { status: 404 }
        );
      }

      const currentUserTier = currentUserRole[0].tier;
      const isCurrentUserSuperAdmin = currentUserRole[0].isSuperAdmin;

      // Only Super Admin can reorder roles
      if (!isCurrentUserSuperAdmin) {
        return NextResponse.json(
          { error: 'Only Super Admin can reorder roles' },
          { status: 403 }
        );
      }

      // Verify all roles exist and prevent Super Admin from being moved
      for (const item of items) {
        const role = await prisma.$queryRaw`
          SELECT tier, isSuperAdmin, name 
          FROM auth_roles 
          WHERE id = ${item.id}
        ` as any[];

        if (!role || role.length === 0) {
          return NextResponse.json(
            { error: `Role with ID ${item.id} not found` },
            { status: 404 }
          );
        }

        const roleData = role[0];

        // Lock Super Admin at tier 1 - cannot be moved
        if (roleData.isSuperAdmin && item.tier !== 1) {
          return NextResponse.json(
            { error: 'Super Admin role cannot be moved from tier 1' },
            { status: 403 }
          );
        }

        // Ensure role has a valid tier before allowing movement
        if (roleData.tier === null) {
          return NextResponse.json(
            { error: `Role "${roleData.name}" has no tier assigned. Please assign a tier first.` },
            { status: 400 }
          );
        }

        // Prevent any role from being moved to tier 1 (Super Admin's position)
        if (item.tier === 1 && !roleData.isSuperAdmin) {
          return NextResponse.json(
            { error: 'Cannot move a role to tier 1 - this position is reserved for Super Admin' },
            { status: 403 }
          );
        }

        // Authorization check: user can only move roles at higher tiers (higher tier numbers = less authority)
        // Current user's tier must be numerically LOWER than the role's tier to move it
        if (
          roleData.tier !== null &&
          roleData.tier <= currentUserTier &&
          !roleData.isSuperAdmin
        ) {
          return NextResponse.json(
            { error: `You do not have authority to move the role "${roleData.name}" (tier ${roleData.tier}). Your role tier (${currentUserTier}) is not senior enough.` },
            { status: 403 }
          );
        }
      }

      // Update all role tiers using raw SQL
      const formatWIB = (await import('@/lib/utils')).formatWIB;
      const now = formatWIB(new Date());
      
      for (const item of items) {
        await prisma.$executeRaw`
          UPDATE auth_roles 
          SET tier = ${item.tier}, updatedAt = ${now}
          WHERE id = ${item.id}
        `;
      }

      // Log the activity
      await logManualActivity({
        tableName: 'auth_roles',
        recordId: 'bulk',
        action: 'UPDATE',
        afterState: { reorderedItems: items },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error reordering roles:', error);
      return NextResponse.json(
        { error: 'Failed to reorder roles' },
        { status: 500 }
      );
    }
  });
}