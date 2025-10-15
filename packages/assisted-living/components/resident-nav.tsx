'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { cn } from './lib/utils'

const navLinks = [
  { name: 'Emergency Contacts', href: '/emergency-contacts' },
  { name: 'Allergies', href: '/allergies' },
  { name: 'Current Medications', href: '/medications' },
  { name: 'Medical Records', href: '/records' },
]

export function ResidentNav({ residentId }: { residentId: string }) {
  const pathname = usePathname()

  return (
    <NavigationMenu>
      <NavigationMenuList className="">
        {navLinks.map((link) => {
          const fullHref = `/admin/dashboard/residents/${residentId}${link.href}`
          const isActive = pathname === fullHref
          return (
            <NavigationMenuItem key={link.name}>
              <Link href={fullHref} passHref>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    'rounded-none hover:border-b-accent-foreground/50 hover:bg-transparent text-muted-foreground hover:text-primary-foreground hover:border-b-2 border-b py-2',
                  )}
                  active={isActive}
                >
                  {link.name}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
