'use client'
import { useRouter } from 'next/navigation'
import { useLayoutEffect } from 'react'

export default function NotFound() {
  const router = useRouter()
  useLayoutEffect(() => {
    let t: any
    t = setTimeout(() => {
      router.push('/admin/dashboard')
    }, 2000)
    return () => t
  }, [])
  return (
    <main className="flex gap-5 md:gap-10 flex-col container sm:w-4/5 py-48 px-8 md:px-32">
      <h1 className="text-5xl font-semibold mb-8 mx-auto text-center">
        Lean EHR
      </h1>
      <h3 className="text-2xl text-center capitalize">
        The requested resource could not be found
      </h3>
    </main>
  )
}
