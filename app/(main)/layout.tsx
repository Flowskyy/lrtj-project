import { getSession } from "@/lib/auth"
import { DashboardLayoutClient } from "./DashboardLayoutClient"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return <DashboardLayoutClient initialSession={session}>{children}</DashboardLayoutClient>
}
