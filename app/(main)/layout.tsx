import { getSession } from "@/lib/auth"
import { getUserPermissions } from "@/lib/permissions"
import { DashboardLayoutClient } from "./DashboardLayoutClient"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Fetch permissions server-side (reliable, doesn't depend on JWT caching)
  let initialPermissions: string[] = []
  if (session?.user?.id) {
    // Try to get roleId from session first, otherwise fetch from DB
    const roleId = (session.user as any).roleId
    if (roleId) {
      initialPermissions = await getUserPermissions(roleId)
    } else {
      const { prisma } = await import("@/lib/prisma")
      const user = await prisma.auth_users.findUnique({
        where: { id: session.user.id },
        select: { roleId: true }
      })
      if (user?.roleId) {
        initialPermissions = await getUserPermissions(user.roleId)
      }
    }
  }

  return <DashboardLayoutClient initialSession={session} initialPermissions={initialPermissions}>{children}</DashboardLayoutClient>
}
