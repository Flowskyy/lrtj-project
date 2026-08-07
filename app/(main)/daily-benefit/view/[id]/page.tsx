import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DailyBenefitViewContentWrapper from "./DailyBenefitViewContentWrapper";

export default async function DailyBenefitViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <DailyBenefitViewContentWrapper dailyBenefitId={id} />;
}
