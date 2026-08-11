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
  const hasAccess = await hasPageAccess(session.user.roleId, '/master/activity-log')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <ActivityLogContent currentUserId={session.user.id} />
}