import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import AddPopupContent from "./AddPopupContent"

export default async function AddPopupPage() {
  const session = await getSession()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Check specific permission for popups
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/popups/add')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <AddPopupContent />
}
