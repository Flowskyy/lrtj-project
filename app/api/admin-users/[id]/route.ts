import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

// DELETE admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userIdToDelete } = await params

    // Safety check: prevent deleting your own account
    if (session.user.id === userIdToDelete) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Check if user exists using raw SQL
    const user = await prisma.$queryRaw`
      SELECT id FROM auth_users WHERE id = ${userIdToDelete}
    ` as any[];

    if (!user || user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user using raw SQL (auth_sessions and auth_accounts will be cascade deleted due to relations)
    await prisma.$queryRaw`
      DELETE FROM auth_users WHERE id = ${userIdToDelete}
    `;

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return NextResponse.json({ error: "Failed to delete admin user" }, { status: 500 })
  }
}
