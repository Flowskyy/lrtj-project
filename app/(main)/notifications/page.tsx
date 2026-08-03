import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationsContent from "./NotificationsContent";

export default async function NotificationsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const username = session.user.email?.split("@")[0] || "Admin";

  return <NotificationsContent username={username} />;
}
