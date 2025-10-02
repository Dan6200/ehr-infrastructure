'use client'

import ResidentDataList from '@/components/resident-list'

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <main className="sm:container bg-background text-center mx-auto py-48 md:py-32">
      <ResidentDataList {...{ residentsData: null }} />
    </main>
  )
}
