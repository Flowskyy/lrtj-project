import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import PopupsContent from "./PopupsContent"

export default async function PopupsPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for popups
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/popups')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <PopupsContent />
}
