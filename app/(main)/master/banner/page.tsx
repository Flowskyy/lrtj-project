import { getSession } from "@/lib/auth"
import BannerConfigContent from "./BannerConfigContent"

export default async function BannerConfigPage() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return <BannerConfigContent username={session.user.email || "Admin"} />
}
