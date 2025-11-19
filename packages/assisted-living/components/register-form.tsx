'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { toast } from '#/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '#/auth/client/config'

const AddAdminFormSchema = z.object({
  email: z.string().min(2, {
    message: 'email must be provided.',
  }),
  password: z.string().min(2, {
    message: 'must provide password.',
  }),
})

type Authenticate = (data: { email: string; password: string }) => Promise<{
  result?: string
  success: boolean
  message: string
}>

interface AddAdminForm {
  addAdmin: Authenticate
}

export function AddAdminForm({ addAdmin }: AddAdminForm) {
  const router = useRouter()
  const form = useForm<z.infer<typeof AddAdminFormSchema>>({
    resolver: zodResolver(AddAdminFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const [admin, setAdmin] = useState<User | null>(null)
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setAdmin(currentUser)
      })
      return () => unsubscribe()
    }
  }, [setAdmin])

  async function onSubmit(
    addAdmin: Authenticate,
    data: z.infer<typeof AddAdminFormSchema>,
  ) {
    const { message, success } = await addAdmin(data)
    toast({ title: message, variant: success ? 'default' : 'destructive' })
  }

  return (
    admin && (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit.bind(null, addAdmin))}
          className="w-full sm:w-4/5 lg:w-3/4 space-y-6"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
                <FormDescription>Add New Admin User's Email</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormMessage />
                <FormDescription>Enter Admin Password</FormDescription>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </Form>
    )
  )
}
