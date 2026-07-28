import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DailyBenefitEditContentWrapper from "./DailyBenefitEditContentWrapper";

export default async function DailyBenefitEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const username = session.user.email?.split("@")[0] || "Admin";

  return <DailyBenefitEditContentWrapper username={username} dailyBenefitId={id} />;
}
