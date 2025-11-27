'use client'

import { DataTable } from '#root/components/dashboard/data-table'
import { ResidentData } from '#root/types'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

export function ResidentsTable({ data }: { data: ResidentData[] }) {
  const columns: ColumnDef<ResidentData>[] = [
    {
      accessorKey: 'resident_name',
      header: 'Name',
      cell: ({ row }) => {
        const resident = row.original
        return (
          <Link
            href={`/admin/dashboard/residents/${resident.id}`}
            className="w-full block"
          >
            {resident.resident_name}
          </Link>
        )
      },
    },
    {
      accessorKey: 'facility_id',
      header: 'Facility ID',
      cell: ({ row }) => {
        const resident = row.original
        return (
          <Link
            href={`/admin/dashboard/residents/${resident.id}`}
            className="w-full block"
          >
            {resident.facility_id}
          </Link>
        )
      },
    },
    {
      accessorKey: 'room_no',
      header: 'Room No.',
      cell: ({ row }) => {
        const resident = row.original
        return (
          <Link
            href={`/admin/dashboard/residents/${resident.id}`}
            className="w-full block"
          >
            {resident.room_no}
          </Link>
        )
      },
    },
    {
      accessorKey: 'dob',
      header: 'Date of Birth',
      cell: ({ row }) => {
        const resident = row.original
        return (
          <Link
            href={`/admin/dashboard/residents/${resident.id}`}
            className="w-full block"
          >
            {resident.dob}
          </Link>
        )
      },
    },
    {
      accessorKey: 'pcp',
      header: 'PCP',
      cell: ({ row }) => {
        const resident = row.original
        return (
          <Link
            href={`/admin/dashboard/residents/${resident.id}`}
            className="w-full block"
          >
            {resident.pcp}
          </Link>
        )
      },
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => {
        const resident = row.original
        return (
          <Link
            href={`/admin/dashboard/residents/${resident.id}`}
            className="w-full block"
          >
            {resident.address}
          </Link>
        )
      },
    },
  ]

  return <DataTable columns={columns} data={data} />
}
