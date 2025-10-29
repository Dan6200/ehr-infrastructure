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
  { name: 'Information', href: '/information' },
  { name: 'Emergency Contacts', href: '/emergency-contacts' },
  { name: 'Allergies', href: '/allergies' },
  { name: 'Current Medications', href: '/medications' },
  { name: 'Diagnostic History', href: '/diagnostic-history' },
  { name: 'Observations', href: '/observations' },
  { name: 'Billing', href: '/billing' },
  { name: 'eMAR', href: '/emar' },
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
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  'group',
                  `rounded-none active:border-b-accent-foreground/50 active:font-bold focus:border-b-accent-foreground/50 focus:font-bold hover:border-b-accent-foreground/40 hover:bg-transparent focus:bg-transparent text-muted-foreground hover:text-primary-foreground/80 active:border-b-2 data-[state=active]:border-b-accent-foreground/50 border-b ${link.name.match(/allerg/i) ? 'text-destructive hover:text-destructive hover:border-b-destructive active:text-destructive active:border-b-destructive focus:text-destructive focus:border-b-destructive' : ''}`,
                )}
                active={isActive}
                asChild
              >
                <Link href={fullHref} className="">
                  {link.name}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
