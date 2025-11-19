import { getResidentData } from '#root/actions/residents/get'
import { ResidentInfoRow } from '#root/components/resident-info'
import { Button } from '#root/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ResidentInformationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const residentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for information page: ${e.message}`,
    )
  })

  return (
    <article className="text-left grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <div className="md:col-span-2 flex flex-col md:flex-row gap-4 justify-between items-center pb-2 mb-8">
        <h2 className="text-xl font-semibold">Resident Information</h2>
        <Button asChild>
          <Link href={`/admin/dashboard/residents/${id}/information/edit`}>
            Edit Information
          </Link>
        </Button>
      </div>
      <ResidentInfoRow label="Room" value={residentData.room_no} />
      <ResidentInfoRow label="Facility ID" value={residentData.facility_id} />
      <ResidentInfoRow label="Facility Address" value={residentData.address} />
      <ResidentInfoRow label="Date of Birth" value={residentData.dob} />
      <ResidentInfoRow
        label="Primary Care Physician"
        value={residentData.pcp}
      />
      <ResidentInfoRow
        label="Email Address"
        value={residentData.resident_email}
      />
      <ResidentInfoRow label="Cell Phone" value={residentData.cell_phone} />
      <ResidentInfoRow label="Work Phone" value={residentData.work_phone} />
      <ResidentInfoRow label="Home Phone" value={residentData.home_phone} />
    </article>
  )
}
