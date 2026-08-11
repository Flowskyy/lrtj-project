import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LarataClubEarningContent from "./LarataClubEarningContent";

export default async function LarataClubEarningPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  return <LarataClubEarningContent />;
}
