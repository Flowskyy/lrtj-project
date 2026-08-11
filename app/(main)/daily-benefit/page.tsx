import { getSession } from "@/lib/auth"
import DailyBenefitContent from "./DailyBenefitContent"

export default async function DailyBenefitPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <DailyBenefitContent />
}
