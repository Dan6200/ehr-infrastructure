import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from '@/components/ui/pagination'

export default function ServerPagination({ totalPages, currentPage }: { totalPages: number; currentPage: number }) {
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams()
    params.set('page', pageNumber.toString())
    return `admin/?${params.toString()}`
  }

  const getPageNumbers = (totalPages: number, currentPage: number, maxPages: number) => {
    if (totalPages <= maxPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
    let endPage = startPage + maxPages - 1

    if (endPage > totalPages) {
      endPage = totalPages
      startPage = endPage - maxPages + 1
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  }

  const desktopPages = getPageNumbers(totalPages, currentPage, 6)
  const mobilePages = getPageNumbers(totalPages, currentPage, 3)

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={createPageURL(currentPage - 1)}
            aria-disabled={currentPage <= 1}
            tabIndex={currentPage <= 1 ? -1 : undefined}
            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>

        {/* Desktop Pagination */}
        {desktopPages.map((page) => (
          <PaginationItem key={`desktop-${page}`} className="hidden md:block">
            <PaginationLink href={createPageURL(page)} isActive={currentPage === page}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Mobile Pagination */}
        {mobilePages.map((page) => (
          <PaginationItem key={`mobile-${page}`} className="block md:hidden">
            <PaginationLink href={createPageURL(page)} isActive={currentPage === page}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href={createPageURL(currentPage + 1)}
            aria-disabled={currentPage >= totalPages}
            tabIndex={currentPage >= totalPages ? -1 : undefined}
            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}