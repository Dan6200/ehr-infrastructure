'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/components/lib/utils'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

const navLinks = [
  { name: 'Information', href: '/information' },
  { name: 'Emergency Contacts', href: '/emergency-contacts' },
  { name: 'Allergies', href: '/allergies' },
  { name: 'Medications', href: '/prescriptions' },
  { name: 'Diagnostic History', href: '/diagnostic-history' },
  { name: 'Labs & Vitals', href: '/observations' },
  { name: 'Billing', href: '/billing' },
  { name: 'eMAR', href: '/emar' },
]

export function ResidentNav({ residentId }: { residentId: string }) {
  const pathname = usePathname()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = React.useState(false)
  const [showRight, setShowRight] = React.useState(false)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeft(scrollLeft > 0)
      setShowRight(scrollLeft < scrollWidth - clientWidth)
    }
  }

  React.useEffect(() => {
    handleScroll() // Check on mount
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative flex items-center w-full">
      <div
        ref={scrollRef}
        className="overflow-x-auto whitespace-nowrap scroll-smooth w-full px-4 sm:px-6 md:px-8"
        onScroll={handleScroll}
      >
        <NavigationMenu className="max-w-none -mx-4 sm:-mx-6 md:-mx-8 w-fit">
          <NavigationMenuList className="flex-nowrap">
            {navLinks.map((link) => {
              const fullHref = `/admin/dashboard/residents/${residentId}${link.href}`
              const isActive = pathname === fullHref
              return (
                <NavigationMenuItem key={link.name}>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      'group',
                      `rounded-none dark:hover:border-b-secondary dark:focus:border-b-secondary dark:focus:text-secondary dark:hover:text-secondary active:border-b-accent-foreground/50 active:font-bold focus:border-b-accent-foreground/50 focus:font-bold hover:border-b-accent-foreground/40 hover:bg-transparent focus:bg-transparent text-muted-foreground hover:text-primary-foreground/80 active:border-b-2 data-[state=active]:border-b-accent-foreground/50 border-b ${link.name.match(/allerg/i) ? 'text-destructive dark:hover:text-destructive dark:hover:border-b-destructive dark:active:text-destructive dark:active:border-b-destructive dark:focus:text-destructive dark:focus:border-b-destructive hover:text-destructive hover:border-b-destructive active:text-destructive active:border-b-destructive focus:text-destructive focus:border-b-destructive' : ''}`,
                    )}
                    active={isActive}
                    asChild
                  >
                    <Link href={fullHref}>{link.name}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      {showLeft && ( //<--- Placed here so it isn't overlapped by the previous component!
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 z-10 h-full bg-gradient-to-r from-background to-transparent hover:bg-transparent hover:text-foreground"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-8" />
        </Button>
      )}
      {showRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 z-10 h-full bg-gradient-to-l from-background to-transparent pl-4 hover:bg-transparent hover:text-foreground"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-8" />
        </Button>
      )}
    </div>
  )
}
