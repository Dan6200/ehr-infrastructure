'use client'
import React, {
  MouseEventHandler,
  MouseEvent,
  useEffect,
  useState,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/firebase/client/config'
import { signOutWrapper } from '@/firebase/auth/client'
import { getAllResidentsData } from '@/app/admin/residents/actions/get'
import { ResidentData } from '@/types'
import Search from './search/index'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { QrCode, SearchIcon, UserRound, UserRoundPlus } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function AdminHeaderItems() {
  const [admin, setAdmin] = useState<User | null>(null)
  const [residentsData, setResidentsData] = useState<ResidentData[] | null>(
    null,
  )
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAdmin(currentUser)
      if (currentUser) {
        // User is logged in, fetch the rooms
        const fetchedData = await getAllResidentsData(
          await currentUser.getIdTokenResult(),
        ).catch((e) => {
          console.log('Failed to Retrieve Rooms -- Tag:14.\n\t' + e)
          return null
        })
        setResidentsData(fetchedData)
      } else {
        // User is not logged in
        setResidentsData(null)
        if (
          !pathname.includes('residents') &&
          !pathname.includes('room') &&
          pathname !== '/admin/sign-in'
        ) {
          router.push('/admin/sign-in')
        }
      }
    })
    return () => unsubscribe()
  }, [pathname, router])

  const handleSignOut: MouseEventHandler<HTMLButtonElement> = async (
    event: MouseEvent,
  ) => {
    event.preventDefault()
    signOutWrapper()
  }

  if (!admin) {
    return null // Don't render anything if not an admin
  }

  return (
    <>
      {residentsData && (
        <Search
          className="w-full md:w-2/5 order-2 md:order-1"
          {...{ residentsData }}
        />
      )}
      <DropdownMenu>
        <div className="flex justify-end order-1 md:order-2">
          <DropdownMenuTrigger className="rounded-full border-primary border-4 bg-primary-foreground w-12 h-12">
            <UserRound className="mx-auto" />
          </DropdownMenuTrigger>

          <DropdownMenuContent className="text-center gap-5 p-2 md:gap-5 bg-background border-2 mr-4 w-[60vw] sm:w-[40vw] md:w-[30vw] lg:w-[20vw]">
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <span
                  onClick={() => router.push('/')}
                  className="cursor-pointer h-9 items-center flex justify-between mx-auto w-full"
                >
                  All Residents
                  <SearchIcon className="w-4 mr-2" />
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span
                  onClick={() => router.push('/admin/new')}
                  className="cursor-pointer h-9 items-center flex justify-between mx-auto w-full"
                >
                  Add New Admin
                  <UserRoundPlus className="w-6" />
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a
                  onMouseDown={() => {
                    toast({ title: 'Printing QR Codes...' })
                  }}
                  href={process.env.NEXT_PUBLIC_QR_PRINT_URL!}
                  download
                  className="cursor-pointer h-9 items-center flex justify-between capitalize mx-auto w-full"
                >
                  Print QR Codes
                  <QrCode className="w-6" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Button onClick={handleSignOut} className="w-full mx-auto">
                  Sign Out
                </Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </>
  )
}
