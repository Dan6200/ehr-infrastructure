'use client'
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
      className={className}
      onClick={url ? () => router.push(url) : () => router.back()}
    >
      <ArrowLeft />
      {children}
    </a>
  )
}
