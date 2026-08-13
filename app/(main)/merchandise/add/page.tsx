import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import MerchandiseAddContent from "./MerchandiseAddContent";

export default async function MerchandiseAddPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for merchandise
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/merchandise/add')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const userEmail = session.user.email || null;

  return <MerchandiseAddContent userEmail={userEmail} />;
}
