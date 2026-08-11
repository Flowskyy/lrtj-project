import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.auth_roles.findMany({
      select: {
        id: true,
        name: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            role_permissions: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}
