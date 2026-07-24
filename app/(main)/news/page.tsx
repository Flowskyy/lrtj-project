import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsContent from "./NewsContent";

export default async function NewsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const username = session.user.email?.split("@")[0] || "Admin";

  return <NewsContent username={username} />;
}
