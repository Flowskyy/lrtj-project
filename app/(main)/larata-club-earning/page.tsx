import { getSession } from "@/lib/auth";
import { hasPageAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import LarataClubEarningContent from "./LarataClubEarningContent";

export default async function LarataClubEarningPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check specific permission for larata club earning
  const hasAccess = await hasPageAccess(session.user.roleId ?? null, '/larata-club-earning')
  if (!hasAccess) {
    redirect('/access-denied')
  }

  return <LarataClubEarningContent />;
}
