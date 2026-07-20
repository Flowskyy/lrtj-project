import { auth } from "@/lib/auth"
import UsersContent from "./UsersContent"

export default async function UsersPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return <UsersContent username={session.user.email || "Admin"} />
}
