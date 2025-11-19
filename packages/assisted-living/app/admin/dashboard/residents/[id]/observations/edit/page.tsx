import { getResidentData } from '#/actions/residents/get'
import { ObservationsForm } from '#/components/residents/form/observations-form'
import { notFound } from 'next/navigation'

export default async function EditObservationsPage({
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
      <ObservationsForm residentData={residentData} />
    </div>
  )
}
