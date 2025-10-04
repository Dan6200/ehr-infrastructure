'use client'
import { useRef, useState } from 'react'
import { Suggestions } from '@/components/header/search/suggestions'
import { ResidentData } from '@/types'
import { SearchBar } from './search-bar'
import { cn } from '@/lib/utils'

interface SearchProps {
  residentsData: ResidentData[] | null
  className: string
}

export default function Search({ residentsData, className }: SearchProps) {
  const [matchingResidentsData, setMatchingResidentsData] = useState<
    null | ResidentData[]
  >(null)
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('', className)}>
      <SearchBar
        {...{
          residentsData,
          matchingResidentsData,
          setMatchingResidentsData,
          setOpen,
        }}
      />
      {matchingResidentsData && open && (
        <Suggestions {...{ matchingResidentsData, setOpen }} />
      )}
    </div>
  )
}
