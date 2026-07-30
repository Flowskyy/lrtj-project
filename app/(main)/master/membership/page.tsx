import { auth } from "@/lib/auth"
import MembershipContent from "./MembershipContent"

export default async function MembershipPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <MembershipContent username={session.user.email || "Admin"} />
}
