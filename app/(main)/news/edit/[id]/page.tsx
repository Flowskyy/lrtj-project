import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsEditContentWrapper from "./NewsEditContentWrapper";

export default async function NewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <NewsEditContentWrapper newsId={id} />;
}
