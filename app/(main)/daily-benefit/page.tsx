import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import DailyBenefitContent from "./DailyBenefitContent"

export default async function DailyBenefitPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for daily benefit
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/daily-benefit')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <DailyBenefitContent />
}
