'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { getAllResidentsData } from '#/actions/residents/get'
import { ResidentData } from '#/types'
import Search from './search/index'
import { auth } from '#/auth/client/config'
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
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser)
        if (currentUser) {
          // User is logged in, fetch the rooms
          const res = await getAllResidentsData({}).catch((e) => {
            if (e.toString().match(/(session|cookie)/i)) {
              return fetch('/api/auth/logout', {
                method: 'post',
              }).then(async (result) => {
                if (result.status === 200) router.push('/sign-in') // Navigate to the login page
              })
            }
            console.error('Failed to Fetch Residents -- Tag:14.\n\t' + e)
            return null
          })
          setResidentsData(res?.residents ?? null)
          if (pathname === '/sign-in') router.push('/admin') // navigate away if middleware gets stuck
        } else {
          // User is not logged in
          setResidentsData(null)
          if (pathname.startsWith('/admin') && pathname !== '/sign-in') {
            return fetch('/api/auth/logout', {
              method: 'post',
            }).then(async (result) => {
              if (result.status === 200) router.push('/sign-in') // Navigate to the login page
            })
          }
        }
      })
      return () => unsubscribe()
    }
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
