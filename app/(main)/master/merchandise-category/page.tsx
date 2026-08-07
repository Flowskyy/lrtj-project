import { getSession } from "@/lib/auth"
import MerchandiseCategoryContent from "./MerchandiseCategoryContent"

export default async function MerchandiseCategoryPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <MerchandiseCategoryContent username={session.user.email || "Admin"} />
}
