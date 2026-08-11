import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsContent from "./NewsContent";

export default async function NewsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  return <NewsContent />;
}
