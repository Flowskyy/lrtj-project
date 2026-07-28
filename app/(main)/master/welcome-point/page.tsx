import { auth } from "@/lib/auth"
import WelcomePointContent from "./WelcomePointContent"

export default async function WelcomePointPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <WelcomePointContent username={session.user.email || "Admin"} />
}
