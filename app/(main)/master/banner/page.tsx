import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import BannerConfigContent from "./BannerConfigContent"

export default async function BannerConfigPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for banner
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/banner')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <BannerConfigContent />
}
