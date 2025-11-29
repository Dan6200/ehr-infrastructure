'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#root/components/ui/use-toast'
import { isError } from '#root/app/utils'
import { PaymentSchema, Payment } from '#root/types/schemas/financial/payment'
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
import { updatePayments } from '#root/actions/residents/update-payments'
import * as React from 'react'

const FormSchema = z.object({
  payments: z
    .array(PaymentSchema.omit({ id: true, resident_id: true }))
    .nullable()
    .optional(),
})

export function PaymentsForm({
  payments,
  residentId,
}: {
  payments: Payment[]
  residentId: string
}) {
  const router = useRouter()
  const [deletedPaymentIds, setDeletedPaymentIds] = React.useState<string[]>([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      payments: payments || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'payments',
  })

  const handleRemove = (index: number) => {
    const paymentId = payments?.[index]?.id
    if (paymentId) {
      setDeletedPaymentIds((prev) => [...prev, paymentId])
    }
    remove(index)
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const paymentsWithIds = (data.payments || []).map((p, index) => ({
        ...p,
        id: payments?.[index]?.id || '',
      }))

      const { message, success } = await updatePayments(
        paymentsWithIds,
        residentId,
        deletedPaymentIds,
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
        <h2 className="text-xl font-semibold">Edit Payments</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-md relative"
          >
            <FormField
              control={form.control}
              name={`payments.${index}.amount.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
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
              name={`payments.${index}.payor`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payor</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Self, Insurance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`payments.${index}.method`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Cash, Card"
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
              name={`payments.${index}.occurrence_datetime`}
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
              amount: { value: 0, currency: 'NGN' },
              payor: '',
              occurrence_datetime: new Date().toISOString(),
            })
          }
        >
          Add Payment
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
