'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { isError } from '@/app/utils'
import { MedicationSchema, ResidentData } from '@/types'
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
import { updateMedications } from '@/actions/residents/update-medications'

import { Autocomplete } from '@/components/ui/autocomplete'
import { searchRxNorm } from '@/actions/lookups/search-rxnorm'

const FormSchema = z.object({
  medications: z.array(MedicationSchema).nullable().optional(),
})

export function MedicationsForm({
  residentData,
}: {
  residentData: ResidentData
}) {
  const router = useRouter()
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      medications: residentData.medications || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'medications',
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const { message, success } = await updateMedications(
        data.medications || [],
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
        <h2 className="text-xl font-semibold">Edit Medications</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-end gap-4 p-4 border rounded-md"
          >
            <FormField
              control={form.control}
              name={`medications.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lisinopril" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`medications.${index}.dosage`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosage</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 10mg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`medications.${index}.frequency`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Daily" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`medications.${index}.rxnorm_code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RxNorm Code</FormLabel>
                  <FormControl>
                    <Autocomplete
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      onSearch={searchRxNorm}
                      placeholder="Search RxNorm..."
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
            append({ name: '', dosage: '', frequency: '', rxnorm_code: '' })
          }
        >
          Add Medication
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
