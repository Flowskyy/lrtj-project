import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsAddContent from "./NewsAddContent";

export default async function NewsAddPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const userEmail = session.user.email || null;

  return <NewsAddContent userEmail={userEmail} />;
}
