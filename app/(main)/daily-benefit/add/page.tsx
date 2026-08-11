import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DailyBenefitAddContent from "./DailyBenefitAddContent";

export default async function DailyBenefitAddPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const userEmail = session.user.email || null;

  return <DailyBenefitAddContent userEmail={userEmail} />;
}
