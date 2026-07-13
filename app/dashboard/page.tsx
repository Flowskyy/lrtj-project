import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#333333] mb-4">
          Welcome {session.user.email}
        </h1>
        <p className="text-gray-600">
          You are now logged in to the LRT Jakarta Portal.
        </p>
      </div>
    </div>
  )
}
