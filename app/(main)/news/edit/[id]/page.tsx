import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsEditContentWrapper from "./NewsEditContentWrapper";

export default async function NewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const username = session.user.email?.split("@")[0] || "Admin";

  return <NewsEditContentWrapper username={username} newsId={id} />;
}
