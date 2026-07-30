import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserViewContentWrapper from "./UserViewContentWrapper";

export default async function UserViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <UserViewContentWrapper userId={id} />;
}
