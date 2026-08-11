import { getSession } from "@/lib/auth"
import RedeemMerchandiseContent from "./RedeemMerchandiseContent"

export default async function RedeemMerchandisePage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <RedeemMerchandiseContent />
}
