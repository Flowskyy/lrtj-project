import { getSession } from "@/lib/auth"
import RedeemBenefitContent from "./RedeemBenefitContent"

export default async function RedeemBenefitPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <RedeemBenefitContent username={session.user.email || "Admin"} />
}
