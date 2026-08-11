import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Get activity logs with filtering and pagination
 * GET /api/activity-logs?table=...&action=...&actor=...&startDate=...&endDate=...&page=...&limit=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const table = searchParams.get('table')
    const action = searchParams.get('action')
    const actor = searchParams.get('actor')
    const role = searchParams.get('role')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (table) {
      where.tableName = table
    }

    if (action) {
      where.action = action
    }

    if (actor) {
      where.actorUserId = actor
    }

    if (role) {
      where.actorRoleName = role
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Get total count
    const total = await prisma.system_activity_logs.count({ where })

    // Get logs with pagination
    const logs = await prisma.system_activity_logs.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    // Convert BigInt fields to strings for JSON serialization
    const serializedLogs = logs.map(log => ({
      ...log,
      id: log.id.toString(),
      actorRoleId: log.actorRoleId ?? null,
      actorRoleName: log.actorRoleName ?? null,
    }))

    return NextResponse.json({
      logs: serializedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get activity logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}