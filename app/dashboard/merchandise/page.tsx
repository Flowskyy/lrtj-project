import { auth } from "@/lib/auth"
import MerchandiseContent from "./MerchandiseContent"

export default async function MerchandisePage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <MerchandiseContent username={session.user.email || "Admin"} />
}
