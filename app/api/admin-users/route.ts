import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatWIB } from "@/lib/utils"

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
      // Use raw SQL with roleId filter - return raw DateTime values (stored as WIB via getWIBDate)
      try {
        users = await prisma.$queryRaw`
          SELECT
            au.id,
            au.name,
            au.email,
            au.roleId,
            ar.name as roleName,
            au.createdAt,
            au.updatedAt,
            au.isOnline,
            au.lastSeen,
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
            au.createdAt,
            au.updatedAt,
            au.isOnline,
            au.lastSeen
          FROM auth_users au
          LEFT JOIN auth_roles ar ON au.roleId = ar.id
          WHERE au.roleId = ${parseInt(roleId)}
          ORDER BY au.createdAt DESC
          LIMIT ${limit} OFFSET ${skip}
        ` as any[];
      }
    } else {
      // Use raw SQL without filter - return raw DateTime values (stored as WIB via getWIBDate)
      try {
        users = await prisma.$queryRaw`
          SELECT
            au.id,
            au.name,
            au.email,
            au.roleId,
            ar.name as roleName,
            au.createdAt,
            au.updatedAt,
            au.isOnline,
            au.lastSeen,
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
            au.createdAt,
            au.updatedAt,
            au.isOnline,
            au.lastSeen
          FROM auth_users au
          LEFT JOIN auth_roles ar ON au.roleId = ar.id
          ORDER BY au.createdAt DESC
          LIMIT ${limit} OFFSET ${skip}
        ` as any[];
      }
    }

    // Format Date objects as WIB strings for proper frontend handling
    const normalizedUsers = users.map((user: any) => ({
      ...user,
      createdAt: formatWIB(user.createdAt),
      updatedAt: formatWIB(user.updatedAt),
      lastSeen: user.lastSeen ? formatWIB(user.lastSeen) : null
    }));

    return NextResponse.json({
      users: normalizedUsers,
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
