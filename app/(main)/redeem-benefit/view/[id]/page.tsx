import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RedeemBenefitViewContentWrapper from "./RedeemBenefitViewContentWrapper";

export default async function RedeemBenefitViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <RedeemBenefitViewContentWrapper redeemBenefitId={id} />;
}