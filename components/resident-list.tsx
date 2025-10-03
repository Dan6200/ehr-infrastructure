'use client'
import { PulsingDiv } from '@/components/ui/pulsing-div'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { auth } from '@/firebase/client/config'
import { ResidentData } from '@/types'
import { onAuthStateChanged, User } from 'firebase/auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function residentDataList({
  residentsData,
}: {
  residentsData: ResidentData[] | null
}) {
  const [displayData, setDisplayData] = useState<ResidentData[] | null>(
    residentsData,
  )
  const [admin, setAdmin] = useState<User | null>(null)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAdmin(currentUser)
    })
    return () => unsubscribe()
  }, [setAdmin])

  useEffect(() => {
    if (residentsData === null) setDisplayData(Array(50).fill(null))
    else setDisplayData(residentsData)
  }, [residentsData])

  return (
    admin && (
      <div className="w-fit rounded-md border-2 mx-auto">
        <Table className="text-base w-[90vw] md:w-[70vw] lg:w-[50vw]">
          <TableCaption>All Residents.</TableCaption>
          <TableHeader className="bg-foreground/20 font-bold rounded-md">
            <TableRow>
              <TableHead className="text-center w-[1vw]">Room Number</TableHead>
              <TableHead className="text-center w-[2vw]">Resident</TableHead>
              <TableHead className="text-center w-[10vw]">
                Facility Address
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData?.map((data: ResidentData | null, index) => (
              <TableRow key={data?.facility_id ?? index}>
                <TableCell className="text-center">
                  {data ? (
                    <Link
                      href={`/residents/${data.document_id}`}
                      className="w-full block"
                    >
                      {data.roomNo}
                    </Link>
                  ) : (
                    <PulsingDiv className="h-5 w-12 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {data ? (
                    <Link
                      href={`/residents/${data.document_id}`}
                      className="w-full block"
                    >
                      {data.resident_name ?? 'Vacant'}
                    </Link>
                  ) : (
                    <PulsingDiv className="h-5 w-32 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {data ? (
                    <Link
                      href={`/residents/${data.document_id}`}
                      className="w-full block"
                    >
                      {data.address}
                    </Link>
                  ) : (
                    <PulsingDiv className="h-5 w-48 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  )
}
