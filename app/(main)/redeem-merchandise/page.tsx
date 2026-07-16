import { auth } from "@/lib/auth"
import RedeemMerchandiseContent from "./RedeemMerchandiseContent"

export default async function RedeemMerchandisePage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <RedeemMerchandiseContent username={session.user.email || "Admin"} />
}
