import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const users = await prisma.$queryRaw`
      SELECT id, name, email, roleId
      FROM auth_users
      WHERE roleId = ${parseInt(id)}
      ORDER BY name ASC
    ` as any[];

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users for role:", error)
    return NextResponse.json({ error: "Failed to fetch users for role" }, { status: 500 })
  }
}
