'use client'

import { Button } from '#/components/ui/button'
import { GoBackLink } from '#/components/go-back-link'
import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row">
      {/* Image Area - Appears first in DOM for mobile-first (top) */}
      <div className="absolute right-0 h-1/3 sm:h-1/2 w-full md:h-full md:w-1/2">
        <Image
          src="/404-compass.png"
          alt="Compass indicating a lost page"
          fill
          className="object-cover dark:brightness-[0.7] dark:grayscale"
        />
      </div>

      {/* Text Content Area */}
      <div className="absolute bottom-0 flex h-2/3 sm:h-1/2 w-full flex-col items-center justify-center gap-8 p-8 text-center md:h-full md:w-1/2">
        <GoBackLink className="">Go Back</GoBackLink>
        <div className="text-7xl md:text-9xl font-bold">404</div>
        <h1 className="text-3xl font-semibold">Page Not Found</h1>
        <p className="text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
