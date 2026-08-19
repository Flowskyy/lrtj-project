import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * Get recent activity logs for Dashboard Activity preview widget
 * This uses system_activity_logs table - the same source as the real Activity Log page
 * GET /api/dashboard/activity?limit=3
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '3');

    // Fetch recent activity logs from system_activity_logs (same as real Activity Log page)
    const logs = await prisma.$queryRaw`
      SELECT
        id,
        actorName,
        actorEmail,
        action,
        tableName,
        DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt
      FROM system_activity_logs
      ORDER BY createdAt DESC
      LIMIT ${limit}
    ` as any[];

    // Convert BigInt id to string
    const serializedLogs = logs.map(log => ({
      ...log,
      id: log.id.toString(),
    }));

    return NextResponse.json({ logs: serializedLogs });
  } catch (error) {
    console.error('Error fetching dashboard activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}