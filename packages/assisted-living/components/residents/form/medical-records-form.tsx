'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { isError } from '@/app/utils'
import { MedicalRecordSchema, ResidentData } from '@/types'
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
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
import { updateMedicalRecords } from '@/actions/residents/update-medical-records'
import { Autocomplete } from '@/components/ui/autocomplete'
import { searchSnomed } from '@/actions/lookups/search-snomed'

const FormSchema = z.object({
  medical_records: z.array(MedicalRecordSchema).nullable().optional(),
})

export function MedicalRecordsForm({
  residentData,
}: {
  residentData: ResidentData
}) {
  const router = useRouter()
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      medical_records: residentData.medical_records || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'medical_records',
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const { message, success } = await updateMedicalRecords(
        data.medical_records || [],
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
        <h2 className="text-xl font-semibold">Edit Medical Records</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-col gap-4 p-4 border rounded-md"
          >
            <div className="flex items-end gap-4">
              <FormField
                control={form.control}
                name={`medical_records.${index}.date`}
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
                name={`medical_records.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Annual Checkup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`medical_records.${index}.snomed_code`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record Type (SNOMED)</FormLabel>
                    <FormControl>
                      <Autocomplete
                        value={field.value || ''}
                        onValueChange={field.onChange}
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
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`medical_records.${index}.notes`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter detailed notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              date: new Date().toISOString().split('T')[0],
              title: '',
              notes: '',
              snomed_code: '',
            })
          }
        >
          Add Medical Record
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
