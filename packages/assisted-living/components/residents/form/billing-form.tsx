'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#/components/ui/use-toast'
import { isError } from '#/app/utils'
import {
  FinancialTransactionSchema,
  ResidentData,
  FinancialTransactionTypeEnum,
} from '#/types'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Trash2 } from 'lucide-react'
import { updateFinancials } from '#/actions/residents/update-financials'

import * as React from 'react'

const FormSchema = z.object({
  financials: z.array(FinancialTransactionSchema).nullable().optional(),
})

export function BillingForm({ residentData }: { residentData: ResidentData }) {
  const router = useRouter()
  const [deletedFinancialIds, setDeletedFinancialIds] = React.useState<
    string[]
  >([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      financials: residentData.financials || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'financials',
  })

  const handleRemove = (index: number) => {
    const financialId = residentData.financials?.[index]?.id
    if (financialId) {
      setDeletedFinancialIds((prev) => [...prev, financialId])
    }
    remove(index)
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const { message, success } = await updateFinancials(
        data.financials || [],
        residentData.id!,
        deletedFinancialIds,
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
        <h2 className="text-xl font-semibold">Edit Financials</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-end gap-4 p-4 border rounded-md"
          >
            <FormField
              control={form.control}
              name={`financials.${index}.date`}
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
              name={`financials.${index}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FinancialTransactionTypeEnum.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
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
              name={`financials.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly Rent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`financials.${index}.amount`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 100.00"
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
            append({
              date: new Date().toISOString().split('T')[0],
              type: 'CHARGE',
              description: '',
              amount: 0,
            })
          }
        >
          Add Transaction
        </Button>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
