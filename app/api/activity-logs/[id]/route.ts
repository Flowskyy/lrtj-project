import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Get a single activity log entry
 * GET /api/activity-logs/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logId = BigInt(id)

    const log = await prisma.system_activity_logs.findUnique({
      where: { id: logId },
    })

    if (!log) {
      return NextResponse.json(
        { error: 'Activity log not found' },
        { status: 404 }
      )
    }

    // Convert BigInt id to string for JSON serialization
    const serializedLog = {
      ...log,
      id: log.id.toString(),
    }

    return NextResponse.json(serializedLog)
  } catch (error: any) {
    console.error('Get activity log error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    )
  }
}