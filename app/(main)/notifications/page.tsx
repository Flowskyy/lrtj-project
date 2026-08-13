import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import NotificationsContent from "./NotificationsContent";

export default async function NotificationsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for notifications
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/notifications')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <NotificationsContent />;
}
