'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from '#root/components/ui/use-toast'
import { isError } from '#root/app/utils'
import { EmergencyContactSchema } from '#root/types/schemas/administrative/emergency-contact'
import { updateEmergencyContacts } from '#root/actions/residents/update-emergency-contacts'
import { useRef } from 'react'
import { EmergencyContactsFormBase } from './EmergencyContactsFormBase'

// Create a schema that only validates the emergency_contacts array
const EmergencyContactsFormSchema = z.object({
  emergency_contacts: z.array(EmergencyContactSchema),
})

export function EmergencyContactsFormEdit({
  documentId,
  initialContacts,
  onFinished,
}: {
  documentId: string
  initialContacts?: z.infer<typeof EmergencyContactSchema>[] | null
  onFinished?: () => void
}) {
  const router = useRouter()
  const form = useForm<z.infer<typeof EmergencyContactsFormSchema>>({
    resolver: zodResolver(EmergencyContactsFormSchema),
    defaultValues: {
      emergency_contacts: initialContacts || [],
    },
  })

  const originalNoOfEmContacts = useRef(initialContacts?.length ?? 0)

  async function onSubmit(data: z.infer<typeof EmergencyContactsFormSchema>) {
    try {
      const { message, success } = await updateEmergencyContacts(
        data.emergency_contacts,
        documentId,
      )
      toast({
        title: message,
        variant: success ? 'default' : 'destructive',
      })
      if (success) {
        onFinished && onFinished()
        router.refresh()
      }
    } catch (err) {
      if (isError(err)) toast({ title: err.message, variant: 'destructive' })
    }
  }

  return (
    <EmergencyContactsFormBase
      form={form}
      onSubmit={onSubmit}
      formTitle="Edit Emergency Contacts"
      originalNoOfEmContacts={originalNoOfEmContacts.current}
    />
  )
}
