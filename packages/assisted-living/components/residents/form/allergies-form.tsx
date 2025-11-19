'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#/components/ui/use-toast'
import { isError } from '#/app/utils'
import { AllergySchema, ResidentData } from '#/types'
import { Button } from '#/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Trash2 } from 'lucide-react'
import { updateAllergies } from '#/actions/residents/update-allergies'

import { Autocomplete } from '#/components/ui/autocomplete'
import { searchSnomed } from '#/actions/lookups/search-snomed'

import * as React from 'react'

const FormSchema = z.object({
  allergies: z.array(AllergySchema).nullable().optional(),
})

export function AllergiesForm({
  residentData,
}: {
  residentData: ResidentData
}) {
  const router = useRouter()
  const [deletedAllergyIds, setDeletedAllergyIds] = React.useState<string[]>([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      allergies: residentData.allergies || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'allergies',
  })

  const handleRemove = (index: number) => {
    const allergyId = residentData.allergies?.[index]?.id
    if (allergyId) {
      setDeletedAllergyIds((prev) => [...prev, allergyId])
    }
    remove(index)
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const { message, success } = await updateAllergies(
        data.allergies || [],
        residentData.id!,
        deletedAllergyIds,
      )
      toast({ title: message, variant: success ? 'default' : 'destructive' })
      if (success) {
        router.back()
        router.refresh()
      }
    } catch (err) {
      if (isError(err)) toast({ title: err.message, variant: 'destructive' })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <h2 className="text-xl font-semibold">Edit Allergies</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-end gap-4 p-4 border rounded-md"
          >
            <FormField
              control={form.control}
              name={`allergies.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergy Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Peanuts" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`allergies.${index}.reaction`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reaction</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Anaphylaxis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`allergies.${index}.snomed_code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SNOMED Code</FormLabel>
                  <FormControl>
                    <Autocomplete
                      value={field.value || ''}
                      onValueChange={(option) => {
                        if (option) {
                          form.setValue(
                            `allergies.${index}.snomed_code`,
                            option.value,
                          )
                          form.setValue(`allergies.${index}.name`, option.label)
                        }
                      }}
                      onSearch={searchSnomed}
                      placeholder="Search SNOMED..."
                      options={[]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleRemove(index)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: '', reaction: '', snomed_code: '' })}
        >
          Add Allergy
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
