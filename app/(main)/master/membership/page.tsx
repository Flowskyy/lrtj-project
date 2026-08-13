import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import MembershipContent from "./MembershipContent"

export default async function MembershipPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for membership
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/membership')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <MembershipContent />
}
