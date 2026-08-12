import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Get activity logs with filtering and pagination
 * GET /api/activity-logs?table=...&action=...&actor=...&role=...&startDate=...&endDate=...&sortBy=...&order=...&page=...&limit=...
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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause for raw SQL
    const whereConditions: string[] = []
    const params: any[] = []

    if (table) {
      whereConditions.push(`tableName = ?`)
      params.push(table)
    }

    if (action) {
      whereConditions.push(`action = ?`)
      params.push(action)
    }

    if (actor) {
      whereConditions.push(`actorUserId = ?`)
      params.push(actor)
    }

    if (role) {
      whereConditions.push(`actorRoleName = ?`)
      params.push(role)
    }

    if (startDate) {
      whereConditions.push(`createdAt >= ?`)
      params.push(startDate)
    }

    if (endDate) {
      whereConditions.push(`createdAt <= ?`)
      params.push(endDate)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Validate sortBy field
    const validSortFields = ['createdAt', 'action', 'tableName']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const sortDirection = order === 'asc' ? 'ASC' : 'DESC'

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM system_activity_logs ${whereClause}`
    const totalResult = await prisma.$queryRawUnsafe(countQuery, ...params) as any[]
    const total = Number(totalResult[0]?.total || 0)

    // Get logs with pagination and sorting
    const selectQuery = `
      SELECT
        id,
        actorUserId,
        actorName,
        actorEmail,
        actorRoleId,
        actorRoleName,
        tableName,
        recordId,
        action,
        beforeState,
        afterState,
        changedFields,
        createdAt,
        revertedAt,
        revertedByUserId
      FROM system_activity_logs
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    
    const allParams = [...params, limit, skip]
    const logs = await prisma.$queryRawUnsafe(selectQuery, ...allParams) as any[]

    // Convert BigInt fields and format dates app-side (WIB convention)
    const serializedLogs = logs.map(log => {
      // Format DateTime objects to ISO string with T so parseWIBString can parse them correctly on client
      const formatDate = (val: any) => {
        if (!val) return null
        const d = new Date(val)
        if (isNaN(d.getTime())) return null
        // Format as YYYY-MM-DDTHH:mm:ss in WIB
        return d.toLocaleString('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(',', '').replace(/\//g, '-').replace(' ', 'T')
      }

      return {
        ...log,
        id: log.id.toString(),
        actorRoleId: log.actorRoleId ?? null,
        actorRoleName: log.actorRoleName ?? null,
        createdAt: formatDate(log.createdAt),
        revertedAt: formatDate(log.revertedAt),
      }
    })

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