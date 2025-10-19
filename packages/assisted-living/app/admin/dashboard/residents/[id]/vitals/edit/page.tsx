import { getResidentData } from '@/actions/residents/get'
import { VitalsForm } from '@/components/residents/form/vitals-form'
import { notFound } from 'next/navigation'

export default async function EditVitalsPage({
  params,
}: {
  params: { id: string }
}) {
  const residentData = await getResidentData(params.id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(`Unable to fetch resident data for edit page: ${e.message}`)
  })

  return (
    <div className="py-8">
      <VitalsForm residentData={residentData} />
    </div>
  )
}
