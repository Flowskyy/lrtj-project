import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import UserViewContentWrapper from "./UserViewContentWrapper";

export default async function UserViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for users
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/users/')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  const { id } = await params;

  return <UserViewContentWrapper userId={id} />;
}
