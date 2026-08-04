import { auth } from "@/lib/auth"
import WelcomePointEditContent from "./WelcomePointEditContent"

export default async function WelcomePointEditPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <WelcomePointEditContent username={session.user.email || "Admin"} />
}
