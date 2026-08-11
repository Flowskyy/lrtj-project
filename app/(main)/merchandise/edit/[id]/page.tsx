import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MerchandiseEditContentWrapper from "./MerchandiseEditContentWrapper";

export default async function MerchandiseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const userEmail = session.user.email || null;

  return <MerchandiseEditContentWrapper userEmail={userEmail} merchandiseId={id} />;
}
