import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import MerchandiseEditContent from "./MerchandiseEditContent";

export default async function MerchandiseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for merchandise
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/merchandise/edit')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;
  const userEmail = session.user.email || null;

  return <MerchandiseEditContent userEmail={userEmail} merchandiseId={id} />;
}
