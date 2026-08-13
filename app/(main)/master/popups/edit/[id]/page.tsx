import { getSession } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"
import { redirect } from "next/navigation"
import EditPopupContent from "./EditPopupContent"

export default async function EditPopupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Check specific permission for popups
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/master/popups/edit')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;

  return <EditPopupContent popupId={id} />
}
