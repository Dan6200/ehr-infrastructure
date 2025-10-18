'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { isError } from '@/app/utils'
import { AllergySchema, ResidentData } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { updateAllergies } from '@/actions/residents/update-allergies'

const FormSchema = z.object({
  allergies: z.array(AllergySchema).nullable().optional(),
})

export function AllergiesForm({
  residentData,
}: {
  residentData: ResidentData
}) {
  const router = useRouter()
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

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const { message, success } = await updateAllergies(
        data.allergies || [],
        residentData.id!,
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
                    <Input placeholder="e.g., 91936005" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() => remove(index)}
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
