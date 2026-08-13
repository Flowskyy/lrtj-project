import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import WelcomePointEditContent from "./WelcomePointEditContent"

export default async function WelcomePointEditPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for welcome point
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/welcome-point/edit')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <WelcomePointEditContent userEmail={session.user.email || ""} />
}
