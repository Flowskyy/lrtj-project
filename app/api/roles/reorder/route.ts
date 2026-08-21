import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';
import { getWIBDate } from '@/lib/utils';

export async function PATCH(request: Request) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    try {
      let body;
      try {
        body = await request.json();
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Invalid request body: expected JSON' },
          { status: 400 }
        );
      }
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

      // Verify all roles exist and prevent locked roles from being moved
      for (const item of items) {
        const role = await prisma.$queryRaw`
          SELECT tier, isSuperAdmin, tierLocked, name 
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

        // Prevent locked roles (isSuperAdmin or tierLocked) from being moved
        if ((roleData.isSuperAdmin || roleData.tierLocked) && item.tier !== roleData.tier) {
          return NextResponse.json(
            { error: `Role "${roleData.name}" is locked and cannot be moved` },
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

        // Prevent any role from being moved to tier 1 if Super Admin exists and is at tier 1
        if (item.tier === 1 && !roleData.isSuperAdmin) {
          const superAdminAtTier1 = await prisma.$queryRaw`
            SELECT id FROM auth_roles WHERE isSuperAdmin = true AND tier = 1
          ` as any[];
          
          if (superAdminAtTier1 && superAdminAtTier1.length > 0) {
            return NextResponse.json(
              { error: 'Cannot move a role to tier 1 - this position is reserved for Super Admin' },
              { status: 403 }
            );
          }
        }

        // Authorization check: user can only move roles at higher tiers (higher tier numbers = less authority)
        // Current user's tier must be numerically LOWER than the role's tier to move it
        // Defensive: treat tier 0 or null as the lowest possible seniority (equivalent to highest tier number + 1)
        const effectiveRoleTier = roleData.tier === 0 || roleData.tier === null ? 999999 : roleData.tier;
        const effectiveUserTier = currentUserTier === 0 || currentUserTier === null ? 999999 : currentUserTier;
        
        if (
          roleData.tier !== null &&
          effectiveRoleTier <= effectiveUserTier &&
          !roleData.isSuperAdmin
        ) {
          return NextResponse.json(
            { error: `You do not have authority to move the role "${roleData.name}" (tier ${roleData.tier}). Your role tier (${currentUserTier}) is not senior enough.` },
            { status: 403 }
          );
        }
      }

      // Update all role tiers using raw SQL
      const now = getWIBDate();
      
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