import { GoBackLink } from '#/components/go-back-link'
import { ResidentForm } from '#/components/residents/form'

export default async function AddResidentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main className="flex flex-col gap-5 bg-background container w-full md:w-2/3 mx-auto py-32">
      <GoBackLink
        url={`/room/${id}`}
        className="cursor-pointer text-blue-700 flex w-full sm:w-3/5 gap-2 sm:gap-5"
        refresh
      >
        Go To Previous Page
      </GoBackLink>
      <ResidentForm
        {...{
          id: null,
          resident_name: '',
          facility_id: '',
          dob: '',
          avatar_url: '',
          room_no: '',
          pcp: '',
          emergency_contacts: [],
        }}
      />
    </main>
  )
}
