'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { getAllResidentsData } from '@/app/admin/residents/actions/get'
import { ResidentData } from '@/types'
import Search from './search/index'
import { toast } from '@/components/ui/use-toast'
import { auth } from '@/firebase/auth/client/config'
import { UserMenu } from './user-menu'

export const SEARCHBOX_WIDTH = 'w-full md:w-[40vw]'

export default function ProtectedHeaderItems() {
  const [user, setUser] = useState<User | null>(null)
  const [residentsData, setResidentsData] = useState<ResidentData[] | null>(
    null,
  )
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // User is logged in, fetch the rooms
        const { residents } = await getAllResidentsData(1, 1000).catch((e) => {
          if (e.toString().match(/(session|cookie)/i)) router.push('/sign-in')
          console.error('Failed to Fetch Residents -- Tag:14.\n\t' + e)
          toast({
            title: 'Failed To Fetch Residents',
            variant: 'destructive',
          })
          return null
        })
        setResidentsData(residents)
      } else {
        // User is not logged in
        setResidentsData(null)
        if (!pathname.startsWith('/admin') && pathname !== '/sign-in') {
          router.push('/sign-in')
        }
      }
    })
    return () => unsubscribe()
  }, [pathname, router])

  if (!user) {
    return null // Don't render anything if not an user
  }

  return (
    <>
      <Search
        className={`${SEARCHBOX_WIDTH} order-3 md:order-2`}
        {...{ residentsData }}
      />
      <UserMenu />
    </>
  )
}
