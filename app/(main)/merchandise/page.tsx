import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import MerchandiseContent from "./MerchandiseContent"

export default async function MerchandisePage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for merchandise
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/merchandise')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <MerchandiseContent />
}
