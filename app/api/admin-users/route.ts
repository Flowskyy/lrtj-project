import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all admin users with roles and last online info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build WHERE clause
    const whereClause = roleId ? `WHERE au.roleId = ${parseInt(roleId)}` : ''

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM auth_users au ${whereClause}`
    const totalResult = await prisma.$queryRawUnsafe(countQuery) as any[]
    const total = Number(totalResult[0]?.total || 0)

    let users: any[];
    
    if (roleId) {
      // Use raw SQL to bypass Prisma's timezone conversion with roleId filter
      try {
        users = await prisma.$queryRaw`
          SELECT
            au.id,
            au.name,
            au.email,
            au.roleId,
            ar.name as roleName,
            DATE_FORMAT(au.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
            DATE_FORMAT(au.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt,
            au.isOnline,
            DATE_FORMAT(au.lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen,
            au.currentPage
          FROM auth_users au
          LEFT JOIN auth_roles ar ON au.roleId = ar.id
          WHERE au.roleId = ${parseInt(roleId)}
          ORDER BY au.createdAt DESC
          LIMIT ${limit} OFFSET ${skip}
        ` as any[];
      } catch (error) {
        // If currentPage column doesn't exist, try without it
        users = await prisma.$queryRaw`
          SELECT
            au.id,
            au.name,
            au.email,
            au.roleId,
            ar.name as roleName,
            DATE_FORMAT(au.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
            DATE_FORMAT(au.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt,
            au.isOnline,
            DATE_FORMAT(au.lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen
          FROM auth_users au
          LEFT JOIN auth_roles ar ON au.roleId = ar.id
          WHERE au.roleId = ${parseInt(roleId)}
          ORDER BY au.createdAt DESC
          LIMIT ${limit} OFFSET ${skip}
        ` as any[];
      }
    } else {
      // Use raw SQL to bypass Prisma's timezone conversion without filter
      try {
        users = await prisma.$queryRaw`
          SELECT
            au.id,
            au.name,
            au.email,
            au.roleId,
            ar.name as roleName,
            DATE_FORMAT(au.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
            DATE_FORMAT(au.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt,
            au.isOnline,
            DATE_FORMAT(au.lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen,
            au.currentPage
          FROM auth_users au
          LEFT JOIN auth_roles ar ON au.roleId = ar.id
          ORDER BY au.createdAt DESC
          LIMIT ${limit} OFFSET ${skip}
        ` as any[];
      } catch (error) {
        // If currentPage column doesn't exist, try without it
        users = await prisma.$queryRaw`
          SELECT
            au.id,
            au.name,
            au.email,
            au.roleId,
            ar.name as roleName,
            DATE_FORMAT(au.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
            DATE_FORMAT(au.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt,
            au.isOnline,
            DATE_FORMAT(au.lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen
          FROM auth_users au
          LEFT JOIN auth_roles ar ON au.roleId = ar.id
          ORDER BY au.createdAt DESC
          LIMIT ${limit} OFFSET ${skip}
        ` as any[];
      }
    }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return NextResponse.json({ error: "Failed to fetch admin users" }, { status: 500 })
  }
}
