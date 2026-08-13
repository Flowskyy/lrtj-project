import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import RolesContent from "./RolesContent"

export default async function RolesPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for roles
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/admin-control-panel/roles')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return (
    <div className="min-h-screen">
      <RolesContent />
    </div>
  )
}
