import { getResidentData } from '@/actions/residents/get'
import { EditResidentDialog } from '@/components/dashboard/residents/edit-resident-dialog'
import { ResidentInfoRow } from '@/components/resident-info'
import { notFound } from 'next/navigation'

export default async function ResidentInformationPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const residentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for information page: ${e.message}`,
    )
  })

  return (
    <article className="text-left grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <div className="md:col-span-2 flex justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Resident Information</h2>
        <EditResidentDialog residentData={residentData} />
      </div>
      <ResidentInfoRow label="Room" value={residentData.room_no} />
      <ResidentInfoRow label="Facility ID" value={residentData.facility_id} />
      <ResidentInfoRow label="Facility Address" value={residentData.address} />
      <ResidentInfoRow label="Date of Birth" value={residentData.dob} />
      <ResidentInfoRow label="PCP" value={residentData.pcp} />
      <ResidentInfoRow label="Email" value={residentData.resident_email} />
      <ResidentInfoRow label="Cell Phone" value={residentData.cell_phone} />
      <ResidentInfoRow label="Work Phone" value={residentData.work_phone} />
      <ResidentInfoRow label="Home Phone" value={residentData.home_phone} />
    </article>
  )
}
