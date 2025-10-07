'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPasswordWrapper } from '@/firebase/auth/client/definitions'
import { User } from 'firebase/auth'
// TODO; see if you can rewrite with useActionState instead of RHF, or even both!!!

const SignInFormSchema = z.object({
  email: z.string().min(2, {
    message: 'email must be provided.',
  }),
  password: z.string().min(2, {
    message: 'must provide password.',
  }),
})

type AuthenticateResult = (
  email: string,
  password: string,
) => Promise<
  | {
      result: string
      message: string
      success: boolean
    }
  | {
      result: string
      message: string
      success: boolean
    }
>

export function SignInForm() {
  const form = useForm<z.infer<typeof SignInFormSchema>>({
    resolver: zodResolver(SignInFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const router = useRouter()

  async function onSubmit(data: z.infer<typeof SignInFormSchema>) {
    const { result, message, success } =
      await signInWithEmailAndPasswordWrapper(data.email, data.password)
    if (success) {
      await fetch('/api/auth/login', {
        method: 'post',
        body: JSON.stringify({ idToken: await (result as User).getIdToken() }),
      })
        .then(async (result) => {
          if (result.ok) {
            router.push('/admin') // Navigate to the homepage
            toast({ title: message, variant: 'default' })
            return result
          } else {
            toast({
              title: 'Failed to Login User',
              description: result.statusText,
              variant: 'destructive',
            })
          }
        })
        .catch((rej) => {
          console.log(rej)
          toast({
            title: 'Failed to Login User',
            description: rej.toString(),
            variant: 'destructive',
          })
        })
    } else {
      if (!success && typeof result === 'string') {
        let description = result as string
        if (description.match(/wrong/i)) description = 'Invalid Credentials'
        if (description.match(/not-found/i))
          description =
            "Can't Find the Associated Account with the Username/Email"
        toast({ title: message, description, variant: 'destructive' })
      }
    }
  }

  return (
    // TODO; see if you can rewrite with useActionState instead of RHF, or even both!!!
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="my-8 w-full sm:w-4/5 lg:w-3/4 space-y-6"
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
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
    </Form>
  )
}
