'use client'
import React from 'react'
import Link from 'next/link'
// import Image from 'next/image'
import ProtectedHeaderItems from './protected-header-items'

export default function Header() {
  return (
    <header
      className={`fixed w-full z-10 bg-background/80 md:gap-[21%] gap-2 flex flex-wrap border-b items-center px-4 py-2`}
    >
      <Link href="/admin" className="w-fit order-1">
        <h3 className="font-bold text-xl">LOGO</h3>
      </Link>
      <ProtectedHeaderItems />
    </header>
  )
}
