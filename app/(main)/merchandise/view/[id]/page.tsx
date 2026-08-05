import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MerchandiseViewContentWrapper from "./MerchandiseViewContentWrapper";

export default async function MerchandiseViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <MerchandiseViewContentWrapper merchandiseId={id} />;
}
