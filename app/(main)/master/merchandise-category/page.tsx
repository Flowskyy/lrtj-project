import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import MerchandiseCategoryContent from "./MerchandiseCategoryContent"

export default async function MerchandiseCategoryPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for merchandise category
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/merchandise-category')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <MerchandiseCategoryContent />
}
