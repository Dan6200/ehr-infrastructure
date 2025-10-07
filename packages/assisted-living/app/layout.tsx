import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/toaster'
// Replacing with Google Analytics...
// import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import Header from '@/components/header/index'
// import Providers from './providers'

import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Lean EHR: Assisted Living',
  description: 'An EHR software solution for assisted living facilities',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        {children}
        <Toaster />
        {/*<Analytics />*/}
      </body>
    </html>
  )
}
