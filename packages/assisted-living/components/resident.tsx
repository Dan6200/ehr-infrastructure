'use client'
import Image from 'next/image'
import type { ResidentData } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/auth/client/config'

export default function Resident({
  id,
  residentData,
}: {
  id: string
  residentData: ResidentData
}) {
  const [, setUser] = useState<User | null>(null)
  const router = useRouter()

  const { resident_name } = residentData

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
      </section>
    </div>
  )
}
