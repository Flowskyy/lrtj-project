import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RolesAddContent from "./RolesAddContent";

export default async function RolesAddPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const username = session.user.email?.split("@")[0] || "Admin";
  const userEmail = session.user.email || null;

  return <RolesAddContent username={username} userEmail={userEmail} />;
}
