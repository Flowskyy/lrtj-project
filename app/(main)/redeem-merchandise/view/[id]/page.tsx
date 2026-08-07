import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RedeemViewContentWrapper from "./RedeemViewContentWrapper";

export default async function RedeemViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <RedeemViewContentWrapper redeemId={id} />;
}
