'use client'
import { Card, CardContent } from '@/components/ui/card'
import type { ResidentData } from '@/types'
import Link from 'next/link'
import { Dispatch, SetStateAction } from 'react'

interface SuggestionProps {
  matchingResidentsData: ResidentData[]
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const Suggestions = ({
  matchingResidentsData,
  setOpen,
}: SuggestionProps) => {
  return (
    <Card className="disable-scrollbars absolute mt-4 py-0 w-full md:w-2/5 md:left-1/3 left-0">
      <div className="w-11/12 relative mx-auto ">
        <CardContent className="my-4 px-0 flex flex-col overflow-y-scroll max-h-[80vh] md:max-h-[40vh] gap-2">
          {matchingResidentsData.length ? (
            matchingResidentsData.map((residents) => (
              <Link
                className="text-left cursor-pointer active:bg-primary/10 hover:bg-primary/10 bg-muted w-full rounded-md p-2 text-nowrap align-bottom"
                href={`/residents/${residents.document_id}`}
                key={residents.document_id}
                onClick={() => setOpen(false)}
              >
                <p className="font-semibold">{residents.facility_id}</p>
                <p>{residents.address}</p>
                <p className="text-sm font-semibold">Rm: {residents.roomNo}</p>
              </Link>
            ))
          ) : (
            <div className="text-left text-muted-foreground">
              Matching Residents Cannot Be Found
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
