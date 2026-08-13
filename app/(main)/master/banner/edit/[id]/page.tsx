import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import EditBannerContent from "./EditBannerContent"

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Check specific permission for banner
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/banner/edit')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;

  return <EditBannerContent bannerId={id} />
}
