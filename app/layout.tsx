import type { Metadata } from 'next'
import '@/firebase/auth/state'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import Header from '@/components/header/index'
import Providers from './providers'

import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'LinkID',
  description: 'System To Manage Patient Information',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
