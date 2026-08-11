import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RolesAddContent from "./RolesAddContent";

export default async function RolesAddPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const userEmail = session.user.email || null;

  return <RolesAddContent userEmail={userEmail} />;
}
