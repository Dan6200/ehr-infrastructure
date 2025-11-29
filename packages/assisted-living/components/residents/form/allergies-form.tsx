'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#root/components/ui/use-toast'
import { isError } from '#root/app/utils'
import { AllergySchema, Allergy } from '#root/types/schemas/clinical/allergy'
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
import { updateAllergies } from '#root/actions/residents/update-allergies'
import { Autocomplete } from '#root/components/ui/autocomplete'
import { searchSnomed } from '#root/actions/lookups/search-snomed'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#root/components/ui/select'
import {
  AllergyClinicalStatusEnum,
  AllergyVerificationStatusEnum,
  AllergyTypeEnum,
} from '#root/types/enums'

import * as React from 'react'

const FormSchema = z.object({
  allergies: z
    .array(
      AllergySchema.omit({
        id: true,
        resident_id: true,
        recorder_id: true,
      }),
    )
    .nullable()
    .optional(),
})

export function AllergiesForm({
  allergies,
  residentId,
}: {
  allergies: Allergy[]
  residentId: string
}) {
  const router = useRouter()
  const [deletedAllergyIds, setDeletedAllergyIds] = React.useState<string[]>([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      allergies: allergies || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'allergies',
  })

  const handleRemove = (index: number) => {
    const allergyId = allergies?.[index]?.id
    if (allergyId) {
      setDeletedAllergyIds((prev) => [...prev, allergyId])
    }
    remove(index)
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const allergiesWithIds = (data.allergies || []).map((a, index) => ({
        ...a,
        id: allergies?.[index]?.id || '',
      }))

      const { message, success } = await updateAllergies(
        allergiesWithIds,
        residentId,
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-md relative"
          >
            <FormField
              control={form.control}
              name={`allergies.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergy (SNOMED)</FormLabel>
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
                          form.setValue(`allergies.${index}.name`, {
                            coding: [
                              {
                                system: 'http://snomed.info/sct',
                                code: option.value,
                                display: option.label,
                              },
                            ],
                            text: option.label,
                          })
                        }
                      }}
                      onSearch={searchSnomed}
                      placeholder="Search..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`allergies.${index}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AllergyTypeEnum.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
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
              name={`allergies.${index}.clinical_status`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinical Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AllergyClinicalStatusEnum.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
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
              name={`allergies.${index}.verification_status`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AllergyVerificationStatusEnum.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
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
              name={`allergies.${index}.recorded_date`}
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
              name={`allergies.${index}.substance`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Substance (SNOMED)</FormLabel>
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
                          form.setValue(`allergies.${index}.substance`, {
                            coding: [
                              {
                                system: 'http://snomed.info/sct',
                                code: option.value,
                                display: option.label,
                              },
                            ],
                            text: option.label,
                          })
                        }
                      }}
                      onSearch={searchSnomed}
                      placeholder="Search Substance..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`allergies.${index}.reaction.code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reaction (SNOMED)</FormLabel>
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
                          form.setValue(`allergies.${index}.reaction.code`, {
                            coding: [
                              {
                                system: 'http://snomed.info/sct',
                                code: option.value,
                                display: option.label,
                              },
                            ],
                            text: option.label,
                          })
                        }
                      }}
                      onSearch={searchSnomed}
                      placeholder="Search Reaction..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`allergies.${index}.reaction.severity`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mild, Severe" {...field} />
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
              clinical_status: 'active',
              verification_status: 'unconfirmed',
              type: 'allergy',
              recorded_date: new Date().toISOString(),
              name: { coding: [], text: '' },
              substance: { coding: [], text: '' },
              reaction: {
                code: { coding: [], text: '' },
                severity: '',
              },
            })
          }
        >
          Add Allergy
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
