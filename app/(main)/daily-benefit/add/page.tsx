import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DailyBenefitAddContent from "./DailyBenefitAddContent";

export default async function DailyBenefitAddPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const username = session.user.email?.split("@")[0] || "Admin";
  const userEmail = session.user.email || null;

  return <DailyBenefitAddContent username={username} userEmail={userEmail} />;
}
