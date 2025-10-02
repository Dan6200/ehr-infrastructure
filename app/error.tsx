'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Roboto_Mono } from 'next/font/google'

const robotoMono = Roboto_Mono({ subsets: ['latin'], display: 'swap' })

export default function Error({
  error,
}: {
  error: Error & { digest: string }
}) {
  const [show, setShow] = useState(false)
  return (
    <main className="flex gap-5 md:gap-10 flex-col container lg:w-4/5 py-48 px-6 sm:px-8 md:px-16 lg:px-32">
      <section>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-8 mx-auto text-center">
          Sorry, We've Run Into An Unexpected Error
        </h1>
        <h3 className="text-lg sm:text-xl text-center">
          Please Try Again Later Or Contact An Admin
        </h3>
      </section>
      <div
        className="mt-16 flex mx-auto w-full justify-center sm:justify-start border-b"
        onMouseDown={() => setShow(!show)}
      >
        <h4 className="mb-4 font-semibold uppercase">developer information</h4>
        {show ? <ChevronUp /> : <ChevronDown />}
      </div>
      {show && (
        <pre className="p-2 my-2 bg-slate-950 rounded-md overflow-x-scroll w-full sm:w-4/5 mx-auto text-wrap">
          <code className={`text-destructive ${robotoMono.className}`}>
            {JSON.stringify(error)
              .replaceAll(/\\n/g, '\n')
              .replaceAll(/\\t/g, '\t')}
          </code>
        </pre>
      )}
    </main>
  )
}
