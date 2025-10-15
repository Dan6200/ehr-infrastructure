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
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setAdmin(currentUser)
      })
      return () => unsubscribe()
    }
  }, [setAdmin])

  return (
    <div className="w-full rounded-lg overflow-hidden md:w-3/5 shadow-md mx-auto">
      <Table className="text-base w-fit sm:w-full overflow-x-scroll">
        <TableCaption>All Residents.</TableCaption>
        <TableHeader className="bg-muted font-bold">
          <TableRow>
            <TableHead className="text-left w-1/6">Room</TableHead>
            <TableHead className="text-left">Resident</TableHead>
            <TableHead className="text-left">Facility Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className=" whitespace-nowrap">
          {residentsData &&
            residentsData.map((data: ResidentData) => (
              <TableRow key={data.id}>
                <TableCell className="text-left">
                  <Link
                    href={`/admin/residents/${data.id}`}
                    className="w-full block"
                  >
                    {data.room_no}
                  </Link>
                </TableCell>
                <TableCell className="text-left">
                  <Link
                    href={`/admin/residents/${data.id}`}
                    className="w-full block"
                  >
                    {data.resident_name ?? 'Vacant'}
                  </Link>
                </TableCell>
                <TableCell className="text-left">
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
