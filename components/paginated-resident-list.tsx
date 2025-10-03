'use client'

import { useState } from 'react'
import ResidentDataList from '@/components/resident-list'
import { ResidentData } from '@/types'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const ITEMS_PER_PAGE = 50

export default function PaginatedResidentList({
  residentsData,
}: {
  residentsData: ResidentData[]
}) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(residentsData.length / ITEMS_PER_PAGE)
  const paginatedData = residentsData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <>
      <ResidentDataList {...{ residentsData: paginatedData }} />
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(currentPage - 1)
              }}
            />
          </PaginationItem>

          <PaginationItem>
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
          </PaginationItem>

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(currentPage + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  )
}
