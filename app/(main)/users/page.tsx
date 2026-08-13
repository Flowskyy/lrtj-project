import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import UsersContent from "./UsersContent"

export default async function UsersPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for users
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/users')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <UsersContent />
}
