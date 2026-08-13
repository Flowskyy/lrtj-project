import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import RedeemBenefitViewContentWrapper from "./RedeemBenefitViewContentWrapper";

export default async function RedeemBenefitViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for redeem benefit
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/redeem-benefit/view')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;

  return <RedeemBenefitViewContentWrapper redeemBenefitId={id} />;
}