'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#root/components/ui/use-toast'
import { isError } from '#root/app/utils'
import { Prescription, PrescriptionSchema } from '#root/types'
import { Button } from '#root/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#root/components/ui/form'
import { Input } from '#root/components/ui/input'
import { Trash2 } from 'lucide-react'
import { updatePrescriptions } from '#root/actions/residents/update-prescriptions'
import { Autocomplete } from '#root/components/ui/autocomplete'
import { searchRxNorm } from '#root/actions/lookups/search-rxnorm'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#root/components/ui/select'
import {
  PrescriptionStatusEnum,
  PrescriptionAdherenceStatusEnum,
} from '#root/types/enums'

import * as React from 'react'

const FormSchema = z.object({
  prescriptions: z
    .array(
      PrescriptionSchema.omit({
        id: true,
        resident_id: true,
        recorder_id: true,
      }),
    )
    .nullable()
    .optional(),
})

export function PrescriptionsForm({
  prescriptions,
  residentId,
}: {
  prescriptions: Prescription[]
  residentId: string
}) {
  const router = useRouter()
  const [deletedPrescriptionIds, setDeletedPrescriptionIds] = React.useState<
    string[]
  >([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prescriptions: prescriptions || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'prescriptions',
  })

  const handleRemove = (index: number) => {
    const prescriptionId = prescriptions?.[index]?.id
    if (prescriptionId) {
      setDeletedPrescriptionIds((prev) => [...prev, prescriptionId])
    }
    remove(index)
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const prescriptionsWithIds = (data.prescriptions || []).map(
        (p, index) => ({
          ...p,
          id: prescriptions?.[index]?.id || '',
        }),
      )

      const { message, success } = await updatePrescriptions(
        prescriptionsWithIds,
        residentId,
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-md relative"
          >
            <FormField
              control={form.control}
              name={`prescriptions.${index}.medication`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication (RxNorm)</FormLabel>
                  <FormControl>
                    <Autocomplete
                      value={field.value?.code?.coding?.[0]?.code || ''}
                      options={
                        field.value?.code?.coding?.[0]?.code
                          ? [
                              {
                                value: field.value.code.coding[0].code,
                                label:
                                  field.value.code.text ||
                                  field.value.code.coding[0].display ||
                                  '',
                              },
                            ]
                          : []
                      }
                      onValueChange={(option) => {
                        if (option) {
                          form.setValue(`prescriptions.${index}.medication`, {
                            ...field.value,
                            code: {
                              coding: [
                                {
                                  system:
                                    'http://www.nlm.nih.gov/research/umls/rxnorm',
                                  code: option.value,
                                  display: option.label,
                                },
                              ],
                              text: option.label,
                            },
                          })
                        }
                      }}
                      onSearch={searchRxNorm}
                      placeholder="Search RxNorm..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`prescriptions.${index}.medication.strength.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strength Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 10"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`prescriptions.${index}.medication.strength.unit`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strength Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., mg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`prescriptions.${index}.status`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PrescriptionStatusEnum.options.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`prescriptions.${index}.adherence`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adherence</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select adherence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PrescriptionAdherenceStatusEnum.options.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`prescriptions.${index}.period.start`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`prescriptions.${index}.period.end`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* TODO: Add Dosage Instruction fields */}
            <div className="absolute top-2 right-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              period: { start: new Date().toISOString(), end: '' },
              status: 'active',
              adherence: 'taking',
              medication: {
                code: {
                  coding: [],
                  text: '',
                },
                strength: { value: 0, unit: '' },
              },
              dosage_instruction: [],
            })
          }
        >
          Add Prescription
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
