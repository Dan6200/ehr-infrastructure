'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce' // Assuming you have a debounce hook

interface AutocompleteProps {
  options: { value: string; label: string }[]
  value: string
  onValueChange: (option: { value: string; label: string } | null) => void
  onSearch: (searchTerm: string) => Promise<{ code: string; name: string }[]>
  placeholder?: string
  emptyMessage?: string
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  onSearch,
  placeholder = 'Select an option...',
  emptyMessage = 'No results found.',
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<
    { value: string; label: string }[]
  >([])
  const [isLoading, setIsLoading] = React.useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  React.useEffect(() => {
    if (debouncedSearchTerm) {
      setIsLoading(true)
      onSearch(debouncedSearchTerm).then((results) => {
        setSearchResults(results.map((r) => ({ value: r.code, label: r.name })))
        setIsLoading(false)
      })
    }
  }, [debouncedSearchTerm, onSearch])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading ? (
              <CommandItem>Loading...</CommandItem>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {searchResults.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => {
                        const option = searchResults.find(
                          (opt) => opt.value === currentValue,
                        )
                        onValueChange(option || null)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === option.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
