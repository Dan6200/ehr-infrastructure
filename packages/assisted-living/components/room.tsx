'use client'
import type { RoomData } from '@/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import Image from 'next/image'
import { deleteResidentData } from '@/app/admin/residents/actions/delete'
import DeleteResident from '@/app/room/[id]/residents/delete'
import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/firebase/client/config'

export default function Room({ roomData }: { roomData: RoomData }) {
  const [admin, setAdmin] = useState<User | null>(null),
    router = useRouter()
  const residents = roomData.residents

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAdmin(currentUser)
    })
    return () => unsubscribe()
  }, [setAdmin])

  return (
    <main className="bg-background flex flex-col gap-8 sm:gap-5 container mx-auto text-center py-56 sm:py-48 h-[130vh]">
      <section className="flex flex-col gap-4 mb-8">
        <h1 className="text-5xl mb-4 font-bold">{roomData.document_id}</h1>
        <p className="font-semibold">Room: {roomData.room}</p>
        <p className="">{roomData.address}</p>
      </section>
      <section className="my-8 w-full">
        <h1 className="text-xl font-semibold mb-8">Residents</h1>
        <div className="flex gap-8 justify-center mx-auto flex-col items-center md:flex-row">
          {residents ? (
            residents.map((resident) => (
              <Card
                className="flex-col flex p-3 md:p-5 shadow-md items-center gap-4 w-[80vw] sm:w-[50vw] md:w-[25vw] "
                key={resident.document_id}
              >
                <Link
                  href={`/room/${roomData.document_id}/residents/${resident.document_id}`}
                  className="flex flex-col gap-6 items-center rounded-md py-2 px-6 md:py-6 md:px-6 h-fit w-full hover:bg-green-700/10 active:bg-green-700/10"
                >
                  <CardHeader className="p-0">
                    <Image
                      src="/profile.svg"
                      alt="profile svg icon"
                      className="border-4 border-black rounded-full"
                      width={64}
                      height={64}
                    />
                  </CardHeader>
                  <CardContent className="grow p-0 flex flex-col justify-center h-3/5 text-center">
                    <h3 className="capitalize items-center md:text-xl">
                      {resident.encrypted_resident_name}
                    </h3>
                  </CardContent>
                </Link>
                {admin && (
                  <CardFooter className="w-full p-0">
                    <DeleteResident
                      {...{
                        resident_name: resident.encrypted_resident_name,
                        resident_id: resident.document_id,
                        deleteResidentData,
                      }}
                    />
                  </CardFooter>
                )}
              </Card>
            ))
          ) : admin ? (
            <p className="capitalize">This room is vacant.</p>
          ) : (
            <p className="capitalize">This room is Vacant.</p>
          )}
        </div>
      </section>
      {admin && (
        <section className="mb-8 flex flex-col md:flex-row md:justify-center md:flex-wrap gap-6 w-full md:w-4/5 lg:w-2/3 mx-auto">
          <div className="flex gap-5 flex-wrap items-center justify-center md:w-2/3">
            <Button
              className="sm:w-64 w-full"
              onMouseDown={() =>
                router.push(
                  `/admin/room/${roomData.document_id}/residents/add?room=${roomData.document_id}`,
                )
              }
            >
              Add New Resident
            </Button>
          </div>
        </section>
      )}
    </main>
  )
}
