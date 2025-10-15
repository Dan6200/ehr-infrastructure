'use client'

import { DataTable } from '@/components/dashboard/data-table'
import { ResidentData } from '@/types'
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
    },
    {
      accessorKey: 'room_no',
      header: 'Room No.',
    },
    {
      accessorKey: 'dob',
      header: 'Date of Birth',
    },
    {
      accessorKey: 'pcp',
      header: 'PCP',
    },
    {
      accessorKey: 'address',
      header: 'Address',
    },
  ]

  return <DataTable columns={columns} data={data} />
}
