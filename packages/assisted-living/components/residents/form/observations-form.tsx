'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#root/components/ui/use-toast'
import { isError } from '#root/app/utils'
import { Observation, ObservationSchema } from '#root/types'
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
import { updateObservations } from '#root/actions/residents/update-observations'
import { Autocomplete } from '#root/components/ui/autocomplete'
import { searchLoinc } from '#root/actions/lookups/search-loinc'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#root/components/ui/select'
import { ObservationStatusEnum } from '#root/types/enums'

import * as React from 'react'

const FormSchema = z.object({
  observations: z
    .array(
      ObservationSchema.omit({
        id: true,
        resident_id: true,
        recorder_id: true,
      }),
    )
    .nullable()
    .optional(),
})

export function ObservationsForm({
  observations,
  residentId,
}: {
  observations: Observation[]
  residentId: string
}) {
  const router = useRouter()
  const [deletedObservationIds, setDeletedObservationIds] = React.useState<
    string[]
  >([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      observations: observations || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'observations',
  })

  const handleRemove = (index: number) => {
    const observationId = observations?.[index]?.id
    if (observationId) {
      setDeletedObservationIds((prev) => [...prev, observationId])
    }
    remove(index)
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const observationsWithIds = (data.observations || []).map(
        (obs, index) => ({
          ...obs,
          id: observations?.[index]?.id || '',
        }),
      )

      const { message, success } = await updateObservations(
        observationsWithIds,
        residentId,
        deletedObservationIds,
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
        <h2 className="text-xl font-semibold">Edit Observations</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md"
          >
            <FormField
              control={form.control}
              name={`observations.${index}.code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observation (LOINC)</FormLabel>
                  <FormControl>
                    <Autocomplete
                      value={field.value?.coding?.[0]?.code || ''}
                      options={
                        field.value?.coding?.[0]?.code
                          ? [
                              {
                                value: field.value.coding[0].code,
                                label:
                                  field.value.text ||
                                  field.value.coding[0].display ||
                                  '',
                              },
                            ]
                          : []
                      }
                      onValueChange={(option) => {
                        if (option) {
                          form.setValue(`observations.${index}.code`, {
                            coding: [
                              {
                                system: 'http://loinc.org',
                                code: option.value,
                                display: option.label,
                              },
                            ],
                            text: option.label,
                          })
                        }
                      }}
                      onSearch={searchLoinc}
                      placeholder="Search LOINC code..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`observations.${index}.value_quantity.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 98.6"
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
              name={`observations.${index}.value_quantity.unit`}
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
            <FormField
              control={form.control}
              name={`observations.${index}.status`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ObservationStatusEnum.options.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
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
              name={`observations.${index}.effective_datetime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleRemove(index)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              status: 'final',
              category: [],
              code: { coding: [], text: '' },
              effective_datetime: new Date().toISOString(),
              value_quantity: { value: 0, unit: '' },
              body_site: { coding: [], text: '' },
              method: { coding: [], text: '' },
              device: { coding: [], text: '' },
            })
          }
        >
          Add Observation
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
