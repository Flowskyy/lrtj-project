import { auth } from "@/lib/auth"
import PopupsContent from "./PopupsContent"

export default async function PopupsPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <PopupsContent username={session.user.email || "Admin"} />
}
