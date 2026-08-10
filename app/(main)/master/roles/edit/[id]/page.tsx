import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RolesEditContent from "./RolesEditContent";

export default async function RolesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const username = session.user.email?.split("@")[0] || "Admin";
  const userEmail = session.user.email || null;

  return <RolesEditContent username={username} userEmail={userEmail} roleId={id} />;
}
