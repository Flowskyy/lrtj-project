import { getSession } from "@/lib/auth"
import MembershipContent from "./MembershipContent"

export default async function MembershipPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <MembershipContent />
}
