'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth' // Added imports

import { toast } from '#root/components/ui/use-toast'
import { isError } from '#root/app/utils'
import { addNewResident } from '#root/actions/residents/add'
import { ResidentFormBase } from './ResidentFormBase'
import type { Resident } from '#root/types'
import { ResidentSchema } from '#root/types/schemas/administrative/resident'
import { auth } from '#root/auth/client/config'

export function ResidentFormAdd({
  facility_id,
}: Pick<Resident, 'facility_id'>) {
  const [idToken, setIdToken] = useState<string | null>(null) // State to hold idToken

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken()
          setIdToken(token)
        } else {
          setIdToken(null)
        }
      })
      return () => unsubscribe()
    }
  }, [])

  const form = useForm<z.infer<typeof ResidentSchema>>({
    resolver: zodResolver(ResidentSchema),
    defaultValues: {
      resident_name: '', // Changed from resident_name
    },
  })

  async function onSubmit(data: z.infer<typeof ResidentSchema>) {
    if (!idToken) {
      toast({
        title: 'Authentication Error',
        description: 'User not authenticated. Please log in again.',
        variant: 'destructive',
      })
      return
    }

    let residentData = {} as Resident
    residentData.resident_name = data.resident_name ?? null // Changed from resident_name
    residentData.facility_id = facility_id

    try {
      const { message, success } = await addNewResident(residentData)
      if (!success) {
        toast({
          title: success ? 'Unable to Add New Resident' : message,
          variant: 'destructive',
        })
        return
      }
      toast({ title: message })
      form.reset({ resident_name: '' }) // Changed
    } catch (err) {
      if (isError(err)) toast({ title: err.message, variant: 'destructive' })
    }
  }

  return (
    <ResidentFormBase
      form={form}
      onSubmit={onSubmit}
      formTitle="Add A New Resident"
      isEditableByDefault={true}
      handleUpload={() => {}}
      includeEmergencyContacts={true}
    />
  )
}
