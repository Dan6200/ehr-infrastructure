'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Button } from '#/components/ui/button'
import { QrCode, SearchIcon, UserRound, UserRoundPlus } from 'lucide-react'
import React, { MouseEventHandler, MouseEvent } from 'react'
import { signOutWrapper } from '#/auth/client/definitions'
import { toast } from '#/components/ui/use-toast'
import { useRouter } from 'next/navigation'

export const UserMenu = () => {
  const router = useRouter()

  const handleSignOut: MouseEventHandler<HTMLButtonElement> = async (
    event: MouseEvent,
  ) => {
    event.preventDefault()
    signOutWrapper()
    await fetch('/api/auth/logout', {
      method: 'post',
    }).then(async (result) => {
      if (result.status === 200) router.push('/sign-in') // Navigate to the login page
    })
  }

  return (
    <DropdownMenu>
      <div className="flex self-end order-2 md:order-3">
        <DropdownMenuTrigger className="rounded-full border-primary border-4 bg-primary-foreground w-12 h-12">
          <UserRound className="mx-auto" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="text-center gap-5 p-2 md:gap-5 bg-background border-2 mr-4 w-[60vw] sm:w-[40vw] md:w-[30vw] lg:w-[20vw]">
          <DropdownMenuLabel>User</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <span
                onClick={() => router.push('/admin')}
                className="cursor-pointer h-9 items-center flex justify-between mx-auto w-full"
              >
                All Residents
                <SearchIcon className="w-4 mr-2" />
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span
                onClick={() => router.push('/admin/create-new-user')}
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
  )
}
