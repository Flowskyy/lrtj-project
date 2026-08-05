import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import DailyBenefitViewContentWrapper from "./DailyBenefitViewContentWrapper";

export default async function DailyBenefitViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const username = cookieStore.get("username")?.value || "";
  const userEmail = cookieStore.get("userEmail")?.value || null;

  if (!username) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <DailyBenefitViewContentWrapper
      username={username}
      userEmail={userEmail}
      dailyBenefitId={id}
    />
  );
}
