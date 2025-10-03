'use client'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { auth } from '@/firebase/auth/client/config'
import { ResidentData } from '@/types'
import { onAuthStateChanged, User } from 'firebase/auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function residentDataList({
  residentsData,
}: {
  residentsData: ResidentData[] | null
}) {
  const [, setAdmin] = useState<User | null>(null)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAdmin(currentUser)
    })
    return () => unsubscribe()
  }, [setAdmin])

  return (
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
          {residentsData &&
            residentsData.map((data: ResidentData) => (
              <TableRow key={data.id}>
                <TableCell className="text-center">
                  <Link
                    href={`/admin/residents/${data.id}`}
                    className="w-full block"
                  >
                    {data.roomNo}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link
                    href={`/admin/residents/${data.id}`}
                    className="w-full block"
                  >
                    {data.resident_name ?? 'Vacant'}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link
                    href={`/admin/residents/${data.id}`}
                    className="w-full block"
                  >
                    {data.address}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
