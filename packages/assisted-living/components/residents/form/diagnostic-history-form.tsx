'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#root/components/ui/use-toast'
import { isError } from '#root/app/utils'
import {
  DiagnosticHistorySchema,
  DiagnosticHistory,
} from '#root/types/schemas/clinical/diagnostic-history'
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
import { updateDiagnosticHistory } from '#root/actions/residents/update-diagnostic-history'
import { Autocomplete } from '#root/components/ui/autocomplete'
import { searchSnomed } from '#root/actions/lookups/search-snomed'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#root/components/ui/select'
import { ConditionStatusEnum } from '#root/types/enums'

import * as React from 'react'

const FormSchema = z.object({
  diagnostic_history: z
    .array(
      DiagnosticHistorySchema.omit({
        id: true,
        resident_id: true,
        recorder_id: true,
      }),
    )
    .nullable()
    .optional(),
})

export function DiagnosticHistoryForm({
  diagnosticHistory,
  residentId,
}: {
  diagnosticHistory: DiagnosticHistory[]
  residentId: string
}) {
  const router = useRouter()
  const [deletedRecordIds, setDeletedRecordIds] = React.useState<string[]>([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      diagnostic_history: diagnosticHistory || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'diagnostic_history',
  })

  const handleRemove = (index: number) => {
    const recordId = diagnosticHistory?.[index]?.id
    if (recordId) {
      setDeletedRecordIds((prev) => [...prev, recordId])
    }
    remove(index)
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const recordsWithIds = (data.diagnostic_history || []).map(
        (rec, index) => ({
          ...rec,
          id: diagnosticHistory?.[index]?.id || '',
        }),
      )

      const { message, success } = await updateDiagnosticHistory(
        recordsWithIds,
        residentId,
        deletedRecordIds,
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
        <h2 className="text-xl font-semibold">Edit Diagnostic History</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md relative"
          >
            <FormField
              control={form.control}
              name={`diagnostic_history.${index}.code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition (SNOMED)</FormLabel>
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
                          form.setValue(`diagnostic_history.${index}.code`, {
                            coding: [
                              {
                                system: 'http://snomed.info/sct',
                                code: option.value,
                                display: option.label,
                              },
                            ],
                            text: option.label,
                          })
                          form.setValue(
                            `diagnostic_history.${index}.title`,
                            option.label,
                          )
                        }
                      }}
                      onSearch={searchSnomed}
                      placeholder="Search SNOMED..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`diagnostic_history.${index}.clinical_status`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinical Status</FormLabel>
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
                      {ConditionStatusEnum.options.map((status) => (
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
              name={`diagnostic_history.${index}.recorded_date`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recorded Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`diagnostic_history.${index}.onset_datetime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Onset Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`diagnostic_history.${index}.abatement_datetime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abatement Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`diagnostic_history.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Hypertension" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              recorded_date: new Date().toISOString(),
              onset_datetime: new Date().toISOString(),
              clinical_status: 'active',
              title: '',
              code: { coding: [], text: '' },
            })
          }
        >
          Add Diagnostic History
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
