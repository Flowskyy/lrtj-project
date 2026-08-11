import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MerchandiseAddContent from "./MerchandiseAddContent";

export default async function MerchandiseAddPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const userEmail = session.user.email || null;

  return <MerchandiseAddContent userEmail={userEmail} />;
}
