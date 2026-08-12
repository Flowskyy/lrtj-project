import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all admin users with roles and last online info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')
    const pending = searchParams.get('pending')

    // Handle pending users query (users with roleId IS NULL - signed in via SSO but not approved)
    if (pending === 'true') {
      try {
        const users = await prisma.$queryRaw`
          SELECT
            au.id,
            au.name,
            au.email,
            au.image,
            DATE_FORMAT(au.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
            DATE_FORMAT(au.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
          FROM auth_users au
          WHERE au.roleId IS NULL
          ORDER BY au.createdAt DESC
        ` as any[];
        return NextResponse.json(users)
      } catch (error) {
        console.error('Error fetching pending users:', error)
        return NextResponse.json({ error: 'Failed to fetch pending users' }, { status: 500 })
      }
    }

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
        ` as any[];
      } catch (error) {
        // If currentPage column doesn't exist, try without it
        console.log('currentPage column might not exist, fetching without it');
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
        ` as any[];
      } catch (error) {
        // If currentPage column doesn't exist, try without it
        console.log('currentPage column might not exist, fetching without it');
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
        ` as any[];
      }
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return NextResponse.json({ error: "Failed to fetch admin users" }, { status: 500 })
  }
}
