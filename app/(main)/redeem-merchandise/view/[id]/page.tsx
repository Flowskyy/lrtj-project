import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import RedeemViewContentWrapper from "./RedeemViewContentWrapper";

export default async function RedeemViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for redeem merchandise
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/redeem-merchandise/view')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;

  return <RedeemViewContentWrapper redeemId={id} />;
}
