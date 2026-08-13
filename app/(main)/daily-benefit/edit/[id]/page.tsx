import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import DailyBenefitEditContentWrapper from "./DailyBenefitEditContentWrapper";

export default async function DailyBenefitEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for daily benefit
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/daily-benefit/edit')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;
  const userEmail = session.user.email || null;

  return <DailyBenefitEditContentWrapper userEmail={userEmail} dailyBenefitId={id} />;
}
