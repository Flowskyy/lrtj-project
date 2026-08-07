import { getSession } from "@/lib/auth"
import RolesContent from "./RolesContent"

export default async function RolesPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <RolesContent username={session.user.email || "Admin"} />
    </div>
  )
}
