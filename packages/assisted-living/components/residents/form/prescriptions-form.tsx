'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#/components/ui/use-toast'
import { isError } from '#/app/utils'
import { PrescriptionSchema, ResidentData } from '#/types'
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
import { updatePrescriptions } from '#/actions/residents/update-prescriptions'

import { Autocomplete } from '#/components/ui/autocomplete'
import { searchRxNorm } from '#/actions/lookups/search-rxnorm'

import * as React from 'react'

const FormSchema = z.object({
  prescriptions: z.array(PrescriptionSchema).nullable().optional(),
})

export function PrescriptionsForm({
  residentData,
}: {
  residentData: ResidentData
}) {
  const router = useRouter()
  const [deletedPrescriptionIds, setDeletedPrescriptionIds] = React.useState<
    string[]
  >([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prescriptions: residentData.prescriptions || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'prescriptions',
  })

  const handleRemove = (index: number) => {
    const prescriptionId = residentData.prescriptions?.[index]?.id
    if (prescriptionId) {
      setDeletedPrescriptionIds((prev) => [...prev, prescriptionId])
    }
    remove(index)
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const { message, success } = await updatePrescriptions(
        data.prescriptions || [],
        residentData.id!,
        deletedPrescriptionIds,
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
        <h2 className="text-xl font-semibold">Edit Prescriptions</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-end gap-4 p-4 border rounded-md"
          >
            <FormField
              control={form.control}
              name={`prescriptions.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescription Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lisinopril" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`prescriptions.${index}.dosage`}
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
              name={`prescriptions.${index}.frequency`}
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
              name={`prescriptions.${index}.rxnorm_code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RxNorm Code</FormLabel>
                  <FormControl>
                    <Autocomplete
                      value={field.value || ''}
                      onValueChange={(option) => {
                        if (option) {
                          form.setValue(
                            `prescriptions.${index}.rxnorm_code`,
                            option.value,
                          )
                          form.setValue(
                            `prescriptions.${index}.name`,
                            option.label,
                          )
                        }
                      }}
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
              onClick={() => handleRemove(index)}
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
          Add Prescription
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
