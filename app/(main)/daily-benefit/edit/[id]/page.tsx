import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DailyBenefitEditContentWrapper from "./DailyBenefitEditContentWrapper";

export default async function DailyBenefitEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const username = session.user.email?.split("@")[0] || "Admin";
  const userEmail = session.user.email || null;

  return <DailyBenefitEditContentWrapper username={username} userEmail={userEmail} dailyBenefitId={id} />;
}
