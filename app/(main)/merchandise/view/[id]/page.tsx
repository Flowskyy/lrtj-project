import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import MerchandiseViewContentWrapper from "./MerchandiseViewContentWrapper";

export default async function MerchandiseViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for merchandise
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/merchandise/view')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;

  return <MerchandiseViewContentWrapper merchandiseId={id} />;
}
