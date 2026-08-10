import { getSession } from "@/lib/auth"
import AuthManagementContent from "./AuthManagementContent.tsx"

export default async function AuthManagementPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <AuthManagementContent username={session.user.email || "Admin"} currentUserId={session.user.id} />
    </div>
  )
}
