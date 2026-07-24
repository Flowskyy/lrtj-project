import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsEditContent from "./NewsEditContent";

export default async function NewsEditPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const username = session.user.email?.split("@")[0] || "Admin";

  return <NewsEditContent username={username} newsId={params.id} />;
}
