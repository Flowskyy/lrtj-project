import { auth } from "@/lib/auth"
import DashboardContent from "./DashboardContent"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <DashboardContent username={session.user.email || "Admin"} />
}
