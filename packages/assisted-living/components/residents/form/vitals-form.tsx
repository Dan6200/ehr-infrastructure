'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { isError } from '@/app/utils'
import { VitalSchema, ResidentData } from '@/types'
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
import { updateVitals } from '@/actions/residents/update-vitals'

const FormSchema = z.object({
  vitals: z.array(VitalSchema).nullable().optional(),
})

export function VitalsForm({ residentData }: { residentData: ResidentData }) {
  const router = useRouter()
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      vitals: residentData.vitals || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'vitals',
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const { message, success } = await updateVitals(
        data.vitals || [],
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
        <h2 className="text-xl font-semibold">Edit Vitals</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-end gap-4 p-4 border rounded-md"
          >
            <FormField
              control={form.control}
              name={`vitals.${index}.date`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`vitals.${index}.loinc_code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LOINC Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 8310-5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`vitals.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 98.6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`vitals.${index}.unit`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., °F" {...field} />
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
          onClick={() =>
            append({
              date: new Date().toISOString().split('T')[0],
              loinc_code: '',
              value: '',
              unit: '',
            })
          }
        >
          Add Vital
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
