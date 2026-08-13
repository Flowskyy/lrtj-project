import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import InvitationContent from "./InvitationContent"

export default async function InvitationPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for invitation
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/admin-control-panel/invitation')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, rgba(229, 38, 44, 0.02) 0%, rgba(189, 130, 38, 0.015) 50%, rgba(51, 51, 51, 0.01) 100%)',
      }}
    >
      <InvitationContent currentUserId={session.user.id} />
    </div>
  )
}