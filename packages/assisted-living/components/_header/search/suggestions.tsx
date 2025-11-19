'use client'
import { Card, CardContent } from '#root/components/ui/card'
import type { ResidentData } from '#root/types'
import Link from 'next/link'
import { Dispatch, SetStateAction } from 'react'
import { SEARCHBOX_WIDTH } from '../protected-header-items'

interface SuggestionProps {
  matchingResidentsData: ResidentData[]
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const Suggestions = ({
  matchingResidentsData,
  setOpen,
}: SuggestionProps) => {
  return (
    <>
      {!!matchingResidentsData.length && (
        <Card
          className={`disable-scrollbars mt-4 py-0 ${SEARCHBOX_WIDTH} absolute`}
        >
          <div className="w-11/12 relative mx-auto ">
            <CardContent className="my-4 px-0 flex flex-col overflow-y-scroll max-h-[80vh] md:max-h-[40vh] gap-2">
              {matchingResidentsData.map((residents) => (
                <Link
                  className="text-left cursor-pointer active:bg-primary/10 hover:bg-primary/10 bg-muted w-full rounded-md p-2 text-nowrap align-bottom"
                  href={`/admin/residents/${residents.id}`}
                  key={residents.id}
                  onClick={() => setOpen(false)}
                >
                  <p className="font-semibold">{residents.resident_name}</p>
                  <p>{residents.address}</p>
                  <p className="text-sm font-semibold">
                    Rm: {residents.room_no}
                  </p>
                </Link>
              ))}
            </CardContent>
          </div>
        </Card>
      )}
    </>
  )
}
