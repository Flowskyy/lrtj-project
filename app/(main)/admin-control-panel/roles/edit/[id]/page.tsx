import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import RolesEditContent from "./RolesEditContent";

export default async function RolesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for roles
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/admin-control-panel/roles/edit')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;
  const userEmail = session.user.email || null;

  return <RolesEditContent userEmail={userEmail} roleId={id} />;
}
