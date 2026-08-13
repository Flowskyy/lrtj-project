import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import NewsAddContent from "./NewsAddContent";

export default async function NewsAddPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for news
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/news/add')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const userEmail = session.user.email || null;

  return <NewsAddContent userEmail={userEmail} />;
}
