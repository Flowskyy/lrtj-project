import { NextRequest, NextResponse } from "next/server"
import { getSessionWithUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithUser()
    
    if (!session?.user?.roleId) {
      return NextResponse.json({ roleName: null })
    }

    // Fetch role name from database
    const role = await prisma.auth_roles.findUnique({
      where: { id: session.user.roleId },
      select: { name: true }
    })

    return NextResponse.json({ roleName: role?.name || null })
  } catch (error) {
    console.error("Error fetching user role:", error)
    return NextResponse.json({ roleName: null }, { status: 500 })
  }
}