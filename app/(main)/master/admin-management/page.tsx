import { getSession } from "@/lib/auth"
import AuthManagementContent from "./AuthManagementContent.tsx"

export default async function AuthManagementPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, rgba(229, 38, 44, 0.02) 0%, rgba(189, 130, 38, 0.015) 50%, rgba(51, 51, 51, 0.01) 100%)',
      }}
    >
      <AuthManagementContent currentUserId={session.user.id} />
    </div>
  )
}
