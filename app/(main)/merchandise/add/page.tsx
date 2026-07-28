import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MerchandiseAddContent from "./MerchandiseAddContent";

export default async function MerchandiseAddPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const username = session.user.email?.split("@")[0] || "Admin";
  const userEmail = session.user.email || null;

  return <MerchandiseAddContent username={username} userEmail={userEmail} />;
}
