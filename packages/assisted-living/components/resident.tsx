'use client'
import Image from 'next/image'
import type { ResidentData } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/firebase/auth/client/config'

function ResidentInfoRow({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
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
  console.log(user)

  const { resident_name, roomNo, facility_id, address } = residentData

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [setUser])

  return (
    <div className="py-8 md:py-16 w-full">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <div className="md:col-span-1 flex flex-col items-center md:items-start gap-4">
          {residentData.avatarUrl ? (
            <Image
              src={residentData.avatarUrl}
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
            {resident_name}
          </h1>
        </div>
        <article className="md:col-span-2 text-left flex flex-col gap-2 pt-4">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">
            Resident Information
          </h2>
          <ResidentInfoRow label="Room" value={roomNo} />
          <ResidentInfoRow label="Facility ID" value={facility_id} />
          <ResidentInfoRow label="Facility Address" value={address} />
          <ResidentInfoRow label="Patient Contact" value="" />
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
