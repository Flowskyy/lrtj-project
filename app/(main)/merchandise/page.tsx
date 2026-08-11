import { getSession } from "@/lib/auth"
import MerchandiseContent from "./MerchandiseContent"

export default async function MerchandisePage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <MerchandiseContent />
}
