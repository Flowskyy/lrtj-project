import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsAddContent from "./NewsAddContent";

export default async function NewsAddPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const username = session.user.email?.split("@")[0] || "Admin";
  const userEmail = session.user.email || null;

  return <NewsAddContent username={username} userEmail={userEmail} />;
}
