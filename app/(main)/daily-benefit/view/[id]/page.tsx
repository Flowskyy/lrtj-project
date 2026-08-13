import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import DailyBenefitViewContentWrapper from "./DailyBenefitViewContentWrapper";

export default async function DailyBenefitViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for daily benefit
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/daily-benefit/view')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;

  return <DailyBenefitViewContentWrapper dailyBenefitId={id} />;
}
