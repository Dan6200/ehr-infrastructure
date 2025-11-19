import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '#/components/ui/pagination' //shadcn ui

interface ServerPaginationProps {
  nextCursor?: string
  prevCursor?: string
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function ServerPagination({
  nextCursor,
  prevCursor,
  hasNextPage,
  hasPrevPage,
}: ServerPaginationProps) {
  const createPageURL = (cursor: string, direction: 'next' | 'prev') => {
    const params = new URLSearchParams()
    params.set(direction, cursor)
    return `/?${params.toString()}`
  }

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={prevCursor ? createPageURL(prevCursor, 'prev') : '#'}
            aria-disabled={!hasPrevPage}
            tabIndex={!hasPrevPage ? -1 : undefined}
            className={
              !hasPrevPage ? 'pointer-events-none opacity-50' : undefined
            }
          />
        </PaginationItem>

        <PaginationItem>
          <PaginationNext
            href={nextCursor ? createPageURL(nextCursor, 'next') : '#'}
            aria-disabled={!hasNextPage}
            tabIndex={!hasNextPage ? -1 : undefined}
            className={
              !hasNextPage ? 'pointer-events-none opacity-50' : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
