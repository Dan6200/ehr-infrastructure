import { getResidentData } from '#root/actions/residents/get'
import { ResidentFormEdit } from '#root/components/residents/form/ResidentFormEdit'
import { notFound } from 'next/navigation'

export default async function ResidentEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const residentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(`Unable to fetch resident data for edit page: ${e.message}`)
  })

  // The onFinished prop is no longer needed as we navigate away
  const { address, ...dataToEdit } = residentData

  return (
    <div className="py-8">
      <ResidentFormEdit {...dataToEdit} />
    </div>
  )
}
