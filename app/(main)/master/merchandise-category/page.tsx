import { auth } from "@/lib/auth"
import MerchandiseCategoryContent from "./MerchandiseCategoryContent"

export default async function MerchandiseCategoryPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <MerchandiseCategoryContent username={session.user.email || "Admin"} />
}
