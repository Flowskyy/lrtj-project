import { redirect } from "next/navigation"

export default function WaitingForApprovalPage() {
  redirect("/access-denied")
}