import { getSession } from "@/lib/auth"
import UsersContent from "./UsersContent"

export default async function UsersPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <UsersContent username={session.user.email || "Admin"} />
}
