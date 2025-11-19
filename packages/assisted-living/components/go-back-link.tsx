'use client'
import { cn } from '#/components/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, ReactNode } from 'react'

export interface GoBackLinkProps {
  className: string
  children: ReactNode
  url?: string
  refresh?: boolean
  id?: string
}

export const GoBackLink: FC<GoBackLinkProps> = ({
  className,
  children,
  url,
  refresh,
}) => {
  const router = useRouter()
  if (refresh) router.refresh()
  return (
    <a
      className={cn(
        'cursor-pointer flex w-full gap-5 text-primary-foreground dark:text-accent dark:hover:text-primary-foreground sm:gap-5 items-center',
        className,
      )}
      href="#"
      onClick={url ? () => router.push(url) : () => router.back()}
    >
      <span className="flex gap-2 rounded-full hover:bg-accent p-1">
        <ArrowLeft className="" />
        <span className="block sm:hidden">{children}</span>
      </span>
    </a>
  )
}
