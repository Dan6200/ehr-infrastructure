'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AdminHeaderItems from './admin-header-items'

export default function Header() {
  return (
    <header
      className={`fixed w-full z-10 bg-background/80 md:gap-[21%] gap-2 flex flex-wrap border-b items-center px-4 py-2`}
    >
      <Link href="/admin" className="w-fit">
        <Image
          priority
          width={100}
          height={100}
          src="/client-logo-small.png"
          alt="LinkId logo"
          className="block md:hidden flex-1"
        />
        <Image
          priority
          width={150}
          height={150}
          src="/client-logo-large.jpeg"
          alt="LinkId logo"
          className="hidden md:block"
        />
      </Link>
      <AdminHeaderItems />
    </header>
  )
}
