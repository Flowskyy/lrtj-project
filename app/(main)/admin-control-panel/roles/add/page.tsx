import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import RolesAddContent from "./RolesAddContent";

export default async function RolesAddPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for roles
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/admin-control-panel/roles/add')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const userEmail = session.user.email || null;

  return <RolesAddContent userEmail={userEmail} />;
}
