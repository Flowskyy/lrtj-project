import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import NewsEditContentWrapper from "./NewsEditContentWrapper";

export default async function NewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for news
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/news/edit')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;

  return <NewsEditContentWrapper newsId={id} />;
}
