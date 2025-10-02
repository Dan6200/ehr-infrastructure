'use client'

import { GoBackLink } from '@/components/go-back-link'
import { ResidentForm } from '@/components/residents/form'
import { useSearchParams } from 'next/navigation'

export default function AddResidentPage({
  params: { id },
}: {
  params: { id: string }
}) {
  const room = useSearchParams().get('room')
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
          resident_name: '',
          facility_id: room as string,
          emergencyContacts: [],
        }}
      />
    </main>
  )
}
