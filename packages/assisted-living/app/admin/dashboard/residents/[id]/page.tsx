import { redirect } from 'next/navigation'

export default async function ResidentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  redirect(`/admin/dashboard/residents/${(await params).id}/information`)
}
