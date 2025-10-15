'use client'
import Image from 'next/image'
import type { ResidentData } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/auth/client/config'

function ResidentInfoRow({
  label,
  value,
}: {
  label: string
  value: string | number | undefined | null
}) {
  if (!value) return null // Only render if value is present
  return (
    <p className="text-base">
      {label}:<span className="text-base font-semibold ml-4">{value}</span>
    </p>
  )
}

export default function Resident({
  id,
  residentData,
}: {
  id: string
  residentData: ResidentData
}) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const { resident_name, room_no, facility_id, address, dob, pcp } =
    residentData

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser)
      })
      return () => unsubscribe()
    }
  }, [setUser])

  return (
    <div className="py-2 md:py-4 w-full">
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12">
        <div className="lg:col-span-1 flex flex-col items-center lg:items-center self-center gap-4">
          {residentData.avatar_url ? (
            <Image
              src={residentData.avatar_url}
              alt="resident avatar"
              className="rounded-full"
              width={128}
              height={128}
            />
          ) : (
            <Image
              src="/avatars/placeholder.png"
              alt="placeholder image"
              className="rounded-full"
              width={128}
              height={128}
            />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-center md:text-left">
            {resident_name ?? 'Resident Name Not Available'}
          </h1>
        </div>
        <article className="md:col-span-3 text-left flex flex-col gap-2 pt-4">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">
            Resident Information
          </h2>
          <ResidentInfoRow label="Room" value={room_no} />
          <ResidentInfoRow label="Facility ID" value={facility_id} />
          <ResidentInfoRow label="Facility Address" value={address} />
          <ResidentInfoRow label="Date of Birth" value={dob} />
          <ResidentInfoRow label="PCP" value={pcp} />
          {user && (
            <div className="mt-6">
              <Button
                className="w-full sm:w-auto"
                onMouseDown={() => router.push(`/user/residents/${id}/edit`)}
              >
                Edit Resident Information
              </Button>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
