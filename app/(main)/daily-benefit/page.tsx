import { auth } from "@/lib/auth"
import DailyBenefitContent from "./DailyBenefitContent"

export default async function DailyBenefitPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <DailyBenefitContent username={session.user.email || "Admin"} />
}
