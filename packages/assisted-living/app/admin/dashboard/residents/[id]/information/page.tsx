import { getResidentData } from '@/actions/residents/get'
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
    <article className="text-left flex flex-col gap-2 pt-4">
      <h2 className="text-center text-2xl font-bold mb-4 pb-2">
        Resident Information
      </h2>
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
