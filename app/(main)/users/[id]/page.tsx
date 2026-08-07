import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserViewContentWrapper from "./UserViewContentWrapper";

export default async function UserViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <UserViewContentWrapper userId={id} />;
}
