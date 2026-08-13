import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import RedeemBenefitContent from "./RedeemBenefitContent"

export default async function RedeemBenefitPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for redeem benefit
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/redeem-benefit')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <RedeemBenefitContent />
}
