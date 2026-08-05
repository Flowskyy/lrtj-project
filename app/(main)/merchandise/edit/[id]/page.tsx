import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MerchandiseEditContentWrapper from "./MerchandiseEditContentWrapper";

export default async function MerchandiseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const username = session.user.email?.split("@")[0] || "Admin";
  const userEmail = session.user.email || null;

  return <MerchandiseEditContentWrapper username={username} userEmail={userEmail} merchandiseId={id} />;
}
