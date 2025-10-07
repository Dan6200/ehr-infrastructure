import { notFound, redirect } from 'next/navigation'
import { getResidentData } from '@/actions/residents/get'
import { ResidentSchema, Resident as ResidentType } from '@/types'
import EmergencyContacts from '@/components/emergency-contacts'

export default async function EmergencyContactsPage({
  params: { id },
}: {
  params: { id: string }
}) {
  const rawResidentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    if (e.message.match(/insufficient permissions/)) redirect('/admin/sign-in')
    throw new Error(
      `Unable to fetch resident data for contacts page -- Tag:EC1.\n\t${e.message}`,
    )
  })
  let validatedResidentData: ResidentType
  try {
    validatedResidentData = ResidentSchema.parse(rawResidentData)
  } catch (error: any) {
    throw new Error('Invalid Resident Data -- Tag:EC2: ' + error.message)
  }

  return (
    <EmergencyContacts contacts={validatedResidentData.emergency_contacts} />
  )
}
