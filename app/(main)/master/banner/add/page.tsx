import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import AddBannerContent from "./AddBannerContent"

export default async function AddBannerPage() {
  const session = await getSession()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Check specific permission for banner
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/banner/add')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <AddBannerContent />
}
