import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

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

      // Get current user's role tier for authorization
      const currentUserRole = await prisma.auth_roles.findUnique({
        where: { id: roleId },
        select: { tier: true, isSuperAdmin: true }
      });

      if (!currentUserRole) {
        return NextResponse.json(
          { error: 'User role not found' },
          { status: 404 }
        );
      }

      const currentUserTier = currentUserRole.tier;
      const isCurrentUserSuperAdmin = currentUserRole.isSuperAdmin;

      // Verify user can reorder each role whose tier is changing
      // A user can only move roles that are at a LOWER tier (higher tier number = less authority)
      // Super Admin (tier 1) cannot be moved by anyone
      for (const item of items) {
        const role = await prisma.auth_roles.findUnique({
          where: { id: item.id },
          select: { tier: true, isSuperAdmin: true, name: true }
        });

        if (!role) {
          return NextResponse.json(
            { error: `Role with ID ${item.id} not found` },
            { status: 404 }
          );
        }

        // Lock Super Admin at tier 1 - cannot be moved
        if (role.isSuperAdmin && item.tier !== 1) {
          return NextResponse.json(
            { error: 'Super Admin role cannot be moved from tier 1' },
            { status: 403 }
          );
        }

        // Ensure role has a valid tier before allowing movement
        if (role.tier === null) {
          return NextResponse.json(
            { error: `Role "${role.name}" has no tier assigned. Please assign a tier first.` },
            { status: 400 }
          );
        }

        // Prevent any role from being moved to tier 1 (Super Admin's position)
        if (item.tier === 1 && !role.isSuperAdmin) {
          return NextResponse.json(
            { error: 'Cannot move a role to tier 1 - this position is reserved for Super Admin' },
            { status: 403 }
          );
        }

        // Authorization check: user can only move roles at higher tiers (higher tier numbers = less authority)
        // Current user's tier must be numerically LOWER than the role's tier to move it
        // Example: Tier 2 user can move Tier 3 roles, but not Tier 1 or Tier 2 roles
        if (
          currentUserTier !== null &&
          role.tier !== null &&
          role.tier <= currentUserTier &&
          !isCurrentUserSuperAdmin
        ) {
          return NextResponse.json(
            { error: `You do not have authority to move the role "${role.name}" (tier ${role.tier}). Your role tier (${currentUserTier}) is not senior enough.` },
            { status: 403 }
          );
        }
      }

      // Update all role tiers in a single transaction
      await prisma.$transaction(
        items.map((item: { id: number; tier: number }) =>
          prisma.auth_roles.update({
            where: { id: item.id },
            data: { tier: item.tier, updatedAt: new Date() },
          })
        )
      );

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