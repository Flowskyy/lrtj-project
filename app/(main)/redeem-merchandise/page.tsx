import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import RedeemMerchandiseContent from "./RedeemMerchandiseContent"

export default async function RedeemMerchandisePage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for redeem merchandise
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/redeem-merchandise')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <RedeemMerchandiseContent />
}
