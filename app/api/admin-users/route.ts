import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all admin users with roles and last online info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')

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
            au.currentPage,
            DATE_FORMAT(
              (SELECT asess.updatedAt FROM auth_sessions asess 
               WHERE asess.userId = au.id 
               ORDER BY asess.updatedAt DESC 
               LIMIT 1),
              '%Y-%m-%dT%H:%i:%s'
            ) as lastOnline
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
            DATE_FORMAT(au.lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen,
            DATE_FORMAT(
              (SELECT asess.updatedAt FROM auth_sessions asess 
               WHERE asess.userId = au.id 
               ORDER BY asess.updatedAt DESC 
               LIMIT 1),
              '%Y-%m-%dT%H:%i:%s'
            ) as lastOnline
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
            au.currentPage,
            DATE_FORMAT(
              (SELECT asess.updatedAt FROM auth_sessions asess 
               WHERE asess.userId = au.id 
               ORDER BY asess.updatedAt DESC 
               LIMIT 1),
              '%Y-%m-%dT%H:%i:%s'
            ) as lastOnline
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
            DATE_FORMAT(au.lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen,
            DATE_FORMAT(
              (SELECT asess.updatedAt FROM auth_sessions asess 
               WHERE asess.userId = au.id 
               ORDER BY asess.updatedAt DESC 
               LIMIT 1),
              '%Y-%m-%dT%H:%i:%s'
            ) as lastOnline
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
