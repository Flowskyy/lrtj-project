import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import NewsContent from "./NewsContent";

export default async function NewsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for news
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/news')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <NewsContent />;
}
