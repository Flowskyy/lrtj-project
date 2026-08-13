import { getSessionWithUser } from '@/lib/auth'
import { hasPageAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import ActivityLogContent from './ActivityLogContent'

export default async function ActivityLogPage() {
  const session = await getSessionWithUser()

  if (!session?.user) {
    redirect('/login')
  }

  // Check specific permission for activity log
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/admin-control-panel/activity-log')
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
      <ActivityLogContent currentUserId={session.user.id} />
    </div>
  )
}
