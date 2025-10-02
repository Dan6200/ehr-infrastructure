'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/client/config'
import {
  getAllResidentsData,
  getAllResidentData,
} from './admin/residents/actions/get'
import residentDataList from '@/components/residentData-list'
import { ResidentData } from '@/types'

export default function Home() {
  const [residentData, setresidentData] = useState<ResidentData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in, fetch residentData
        const fetchedresidentData = await getAllResidentsData(
          user.getIdTokenResult(),
        ).catch((e) => {
          console.error('Failed to fetch residentData:', e)
          return null // Handle error gracefully
        })
        setresidentData(fetchedresidentData)
      } else {
        // User is not logged in, redirect to sign-in page
        router.push('/admin/sign-in')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    // You can return a loading spinner here
    return (
      <main className="sm:container bg-background text-center mx-auto py-32 md:py-24">
        Loading...
      </main>
    )
  }

  if (!residentData) {
    // This can be a more specific error message or component
    return (
      <main className="sm:container bg-background text-center mx-auto py-32 md:py-24">
        Unable to fetch residentData.
      </main>
    )
  }

  return (
    <main className="sm:container bg-background text-center mx-auto py-32 md:py-24">
      <ResidentDataList {...{ residentData }} />
    </main>
  )
}
