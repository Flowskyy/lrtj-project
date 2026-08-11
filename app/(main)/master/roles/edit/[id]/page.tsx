import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RolesEditContent from "./RolesEditContent";

export default async function RolesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const userEmail = session.user.email || null;

  return <RolesEditContent userEmail={userEmail} roleId={id} />;
}
