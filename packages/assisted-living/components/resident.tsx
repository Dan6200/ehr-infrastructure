'use client'
import Image from 'next/image'
import type { Resident, ResidentData } from '@/types'
import { PhoneCall } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter } from './ui/card'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/firebase/auth/client/config'

export default function Resident({
  id,
  residentData,
}: {
  id: string
  residentData: ResidentData
}) {
  const [admin, setAdmin] = useState<User | null>(null),
    router = useRouter()

  const { resident_name, roomNo, facility_id, address, emergencyContacts } =
    residentData

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAdmin(currentUser)
    })
    return () => unsubscribe()
  }, [setAdmin])

  const numContacts = emergencyContacts ? emergencyContacts.length : 0

  let gridColsClass = 'grid-cols-1' // Default for small screens or single item

  if (numContacts >= 2) {
    gridColsClass = 'grid-cols-1 md:grid-cols-2'
  }
  // } else if (numContacts >= 3) {
  //   gridColsClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  // }

  return (
    <div className="py-8 md:py-16 space-y-16 sm:space-y-18 md:space-y-24">
      <section className="flex items-start gap-4 sm:gap-8 md:gap-12">
        {residentData.avatarUrl ? (
          <Image
            src={residentData.avatarUrl}
            alt="resident avatar"
            className="rounded-full"
            width={96}
            height={96}
          />
        ) : (
          <Image
            src="/avatars/placeholder.png"
            alt="placeholder image"
            className="rounded-full"
            width={96}
            height={96}
          />
        )}
        <article className="text-left flex flex-col gap-2">
          <h1 className="text-5xl font-bold mb-4">{resident_name}</h1>
          <p className="text-lg ">
            Room: <span className="text-xl ml-4">{roomNo}</span>
          </p>
          <p className="text-lg ">
            Facility ID: <span className="text-xl ml-4">{facility_id}</span>
          </p>
          <p className="text-lg ">
            Facility Address: <span className="text-xl ml-4">{address}</span>
          </p>
          <p className="text-lg ">
            Patient Contact:<span className="text-xl ml-4"></span>
          </p>
          {admin && (
            <section className="">
              <Button
                className="sm:w-64"
                onMouseDown={() => router.push(`/admin/residents/${id}/edit`)}
              >
                Edit Resident Information
              </Button>
            </section>
          )}
        </article>
      </section>
      {/*<section className="space-y-12 sm:space-y-18">
        <h3 className="text-2xl font-bold">Contacts</h3>
        <section
          className={`grid ${gridColsClass} gap-6 w-full md:w-fit mx-auto`}
        >
          {emergencyContacts ? (
            emergencyContacts.map((contact: any, index: number) => (
              <Link
                key={index + contact.contact_name.split(' ')[0]}
                href={`tel:${contact.cell_phone}`}
                className="w-full sm:w-fit"
              >
                <Card className="justify-between hover:bg-green-700/10 active:bg-green-700/10 flex shadow-md p-4 w-full md:p-6 items-center ">
                  <CardContent className="p-0 flex justify-between text-left ">
                    <h3 className="capitalize font-semibold md:text-xl">
                      {contact.contact_name}
                    </h3>
                    {contact.relationship && (
                      <p className="capitalize">{contact.relationship}</p>
                    )}
                    {contact.cell_phone && (
                      <p className="text-green-700 font-semibold">
                        {contact.cell_phone}
                      </p>
                    )}
                    {contact.home_phone && (
                      <p className="text-green-700 font-semibold">
                        {contact.home_phone}
                      </p>
                    )}
                    {contact.work_phone && (
                      <p className="text-green-700 font-semibold">
                        {contact.work_phone}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="shrink p-2">
                    <PhoneCall className="text-green-700 font-bold mx-auto" />
                  </CardFooter>
                </Card>
              </Link>
            ))
          ) : (
            <p>No Emergency Contacts On Record</p>
          )}
        </section>
      </section>*/}
    </div>
  )
}
