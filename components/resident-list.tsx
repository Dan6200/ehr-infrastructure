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
import { auth } from '@/firebase/client/config'
import { Facility, ResidentData } from '@/types'
import { onAuthStateChanged, User } from 'firebase/auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function residentDataList({
  residentDatas,
}: {
  residentDatas: (Facility & { document_id: string })[]
}) {
  const [admin, setAdmin] = useState<User | null>(null)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAdmin(currentUser)
    })
    return () => unsubscribe()
  }, [setAdmin])

  return (
    admin && (
      <div className="w-fit rounded-md border-2 mx-auto">
        <Table className="text-base w-[90vw] md:w-[70vw] lg:w-[60vw]">
          <TableCaption>All residentDatas In The Facility.</TableCaption>
          <TableHeader className="bg-foreground/20 font-bold rounded-md">
            <TableRow>
              <TableHead className="text-center md:w-[5vw]">Keyword</TableHead>
              <TableHead className="text-center md:w-[5vw]">
                residentData
              </TableHead>
              <TableHead className="text-center md:w-[20vw]">Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {residentsData?.map(
              ({ document_id, residentData, address }: ResidentData) => {
                return (
                  <TableRow key={document_id}>
                    <TableCell className="text-center">
                      <Link
                        href={`/residents/${document_id}`}
                        className="w-full block"
                      >
                        {document_id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link
                        href={`/residents/${document_id}`}
                        className="w-full block"
                      >
                        {residentData}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link
                        href={`/residents/${document_id}`}
                        className="w-full block"
                      >
                        {address}
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              },
            )}
          </TableBody>
        </Table>
      </div>
    )
  )
}
