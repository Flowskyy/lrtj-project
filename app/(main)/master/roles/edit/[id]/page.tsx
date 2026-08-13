import { redirect } from 'next/navigation'

export default function RolesEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin-control-panel/roles/edit/${params.id}`)
}
