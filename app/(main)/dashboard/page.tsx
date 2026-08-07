import { getSession } from "@/lib/auth"
import DashboardContent from "./DashboardContent"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <DashboardContent username={session.user.email || "Admin"} />
}
