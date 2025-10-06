'use client'
import { cn } from '@/lib/utils'
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
        'cursor-pointer text-blue-500 flex w-full gap-5 sm:gap-5 items-center',
        className,
      )}
      href="#"
      onClick={url ? () => router.push(url) : () => router.back()}
    >
      <span className="rounded-full bg-blue-700/20 p-1">
        <ArrowLeft className="text-blue-700" />
      </span>
      {children}
    </a>
  )
}
