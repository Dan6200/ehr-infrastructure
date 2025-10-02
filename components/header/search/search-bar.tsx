'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Dispatch, SetStateAction, useEffect, useRef } from 'react'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ResidentData } from '@/types'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

const SearchValueSchema = z.object({
  searchValue: z.string(),
})

interface SearchBarProps {
  residentsData: ResidentData[]
  matchingResidentsData: ResidentData[] | null
  setMatchingResidentsData: Dispatch<SetStateAction<ResidentData[] | null>>
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const SearchBar = ({
  residentsData,
  matchingResidentsData,
  setMatchingResidentsData,
  setOpen,
}: SearchBarProps) => {
  const form = useForm<z.infer<typeof SearchValueSchema>>({
    resolver: zodResolver(SearchValueSchema),
    defaultValues: {
      searchValue: '',
    },
  })

  const router = useRouter()

  const { watch } = form

  const nameRef = useRef<HTMLInputElement | null>(null)
  // Run effect when searchValue changes
  useEffect(() => {
    const searchValue = watch('searchValue')
    Send(searchValue)
  }, [watch('searchValue')]) // useEffect instead of useMemo

  useEffect(() => {
    const handleClick = (e: Event) => {
      if (nameRef?.current && !nameRef?.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('click', handleClick)
    ;() => document.removeEventListener('click', handleClick)
  }, [nameRef?.current])

  async function Send(searchValue: string) {
    let matchingResidentsData: ResidentData[] = []
    if (searchValue) {
      matchingResidentsData = residentsData.filter(
        (residentsData) =>
          residentsData.address
            .toLowerCase() // Ignore case
            .replaceAll(/[^a-zA-Z0-9]/g, '') // Ignore non-alnum chars
            .slice(0, 25)
            .includes(
              searchValue.toLowerCase().replaceAll(/[^a-zA-Z0-9]/g, ''),
            ) ||
          residentsData.roomNo
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          residentsData.facility_id
            .toLowerCase()
            .includes(searchValue.toLowerCase()),
      )
    }

    // Update matchingResidentsData state
    setMatchingResidentsData(matchingResidentsData)
  }

  async function onSubmit() {
    router.push(`/residentsDatas/${matchingResidentsData?.[0].document_id}`)
    setOpen(!open)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="disable-scrollbars w-full mx-auto overflow-x-scroll flex"
      >
        <FormField
          control={form.control}
          name="searchValue"
          render={({ field }) => (
            <div className="w-full flex items-center gap-2">
              <FormItem
                tabIndex={5}
                className="px-2 ring-offset-background border-2 border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md flex place-items-center space-y-0 w-full gap-2 place-self-center"
              >
                <FormControl>
                  <Input
                    onFocus={() => setOpen(true)}
                    {...field}
                    ref={nameRef}
                    type="text"
                    className="p-0 m-0 block space-y-0 w-full focus-visible:outline-none overscroll-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </FormControl>
                <Search />
              </FormItem>
            </div>
          )}
        />
      </form>
    </Form>
  )
}
