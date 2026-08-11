import { getSessionWithUser } from "@/lib/auth"
import { syncAzureRoles } from "@/lib/azure-sync"
import { DashboardLayoutClient } from "./DashboardLayoutClient"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionWithUser()

  // Sync Azure AD roles for Microsoft SSO users once per page load
  // (instead of on every middleware request)
  if (session?.user?.id) {
    await syncAzureRoles(session.user.id)
  }

  return <DashboardLayoutClient initialSession={session}>{children}</DashboardLayoutClient>
}
