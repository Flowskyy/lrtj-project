import { getSession } from "@/lib/auth"
import PopupsContent from "./PopupsContent"

export default async function PopupsPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <PopupsContent />
}
