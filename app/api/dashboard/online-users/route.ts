import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch online users filtered by role's showOnDashboard setting
    const onlineUsers = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        r.name as role
      FROM auth_users u
      INNER JOIN auth_roles r ON u.roleId = r.id
      WHERE u.isOnline = true
        AND r.showOnDashboard = true
      ORDER BY u.name ASC
    ` as any[];

    return NextResponse.json({ users: onlineUsers });
  } catch (error) {
    console.error('Error fetching dashboard online users:', error);
    return NextResponse.json({ error: 'Failed to fetch online users' }, { status: 500 });
  }
}
