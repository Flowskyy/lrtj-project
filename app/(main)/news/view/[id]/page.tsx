import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import NewsViewContentWrapper from "./NewsViewContentWrapper";

export default async function NewsViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for news
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/news/view')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;

  return <NewsViewContentWrapper newsId={id} />;
}
