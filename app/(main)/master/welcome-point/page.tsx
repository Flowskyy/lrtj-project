import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import WelcomePointContent from "./WelcomePointContent"

export default async function WelcomePointPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for welcome point
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/welcome-point')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <WelcomePointContent />
}
