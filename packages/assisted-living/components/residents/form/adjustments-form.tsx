'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#root/components/ui/use-toast'
import { isError } from '#root/app/utils'
import {
  AdjustmentSchema,
  Adjustment,
} from '#root/types/schemas/financial/adjustment'
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
import { updateAdjustments } from '#root/actions/residents/update-adjustments'
import * as React from 'react'

const FormSchema = z.object({
  adjustments: z
    .array(AdjustmentSchema.omit({ id: true, resident_id: true }))
    .nullable()
    .optional(),
})

export function AdjustmentsForm({
  adjustments,
  residentId,
}: {
  adjustments: Adjustment[]
  residentId: string
}) {
  const router = useRouter()
  const [deletedAdjustmentIds, setDeletedAdjustmentIds] = React.useState<
    string[]
  >([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      adjustments: adjustments || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'adjustments',
  })

  const handleRemove = (index: number) => {
    const adjustmentId = adjustments?.[index]?.id
    if (adjustmentId) {
      setDeletedAdjustmentIds((prev) => [...prev, adjustmentId])
    }
    remove(index)
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const adjustmentsWithIds = (data.adjustments || []).map((a, index) => ({
        ...a,
        id: adjustments?.[index]?.id || '',
      }))

      const { message, success } = await updateAdjustments(
        adjustmentsWithIds,
        residentId,
        deletedAdjustmentIds,
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
        <h2 className="text-xl font-semibold">Edit Adjustments</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-md relative"
          >
            <FormField
              control={form.control}
              name={`adjustments.${index}.claim_id`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Claim ID..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`adjustments.${index}.reason`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Reason for adjustment..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`adjustments.${index}.approved_amount.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approved Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
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
              name={`adjustments.${index}.authored_on`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
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
              claim_id: '',
              reason: '',
              approved_amount: { value: 0, currency: 'NGN' },
              authored_on: new Date().toISOString(),
            })
          }
        >
          Add Adjustment
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
