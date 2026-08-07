import { NextRequest, NextResponse } from "next/server"
import { getUserPermissions } from "@/lib/permissions"
import { getSessionWithUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithUser()
    
    if (!session?.user?.roleId) {
      return NextResponse.json({ permissions: [] })
    }

    const permissions = await getUserPermissions(session.user.roleId)
    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    return NextResponse.json({ permissions: [] }, { status: 500 })
  }
}
