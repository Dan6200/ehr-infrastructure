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
import { auth } from '@/auth/client/config'
import { ResidentData } from '@/types'
import { onAuthStateChanged, User } from 'firebase/auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ResidentList({
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
    <div className="w-full md:w-3/5 sm:rounded-md border-y-2 sm:border-2 mx-auto">
      <Table className="text-base w-fit sm:w-full overflow-x-scroll">
        <TableCaption>All Residents.</TableCaption>
        <TableHeader className="bg-foreground/20 font-bold rounded-md">
          <TableRow>
            <TableHead className="text-center sm:w-[1vw]">
              <span className="sm:hidden">Room</span>
              <span className="hidden sm:inline">Room Number</span>
            </TableHead>
            <TableHead className="text-center sm:w-[2vw]">Resident</TableHead>
            <TableHead className="text-center sm:w-[10vw]">
              Facility Address
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className=" whitespace-nowrap">
          {residentsData &&
            residentsData.map((data: ResidentData) => (
              <TableRow key={data.id}>
                <TableCell className="text-center">
                  <Link
                    href={`/admin/residents/${data.id}`}
                    className="w-full block"
                  >
                    {data.room_no}
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
