import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import DailyBenefitAddContent from "./DailyBenefitAddContent";

export default async function DailyBenefitAddPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for daily benefit
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/daily-benefit/add')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const userEmail = session.user.email || null;

  return <DailyBenefitAddContent userEmail={userEmail} />;
}
