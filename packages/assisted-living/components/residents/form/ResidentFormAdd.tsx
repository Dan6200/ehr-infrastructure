'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth' // Added imports

import { toast } from '#/components/ui/use-toast'
import { isError } from '#/app/utils'
import { addNewResident } from '#/actions/residents/add'
import { ResidentFormBase } from './ResidentFormBase'
import type { ResidentData } from '#/types'
import { ResidentDataSchema } from '#/types'
import { auth } from '#/auth/client/config'

export function ResidentFormAdd({
  facility_id,
}: Pick<ResidentData, 'facility_id'>) {
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

  const form = useForm<z.infer<typeof ResidentDataSchema>>({
    resolver: zodResolver(ResidentDataSchema),
    defaultValues: {
      resident_name: '', // Changed from resident_name
      emergency_contacts: [],
    },
  })

  async function onSubmit(data: z.infer<typeof ResidentDataSchema>) {
    if (!idToken) {
      toast({
        title: 'Authentication Error',
        description: 'User not authenticated. Please log in again.',
        variant: 'destructive',
      })
      return
    }

    let residentData = {} as ResidentData
    residentData.resident_name = data.resident_name ?? null // Changed from resident_name
    residentData.facility_id = facility_id

    if (data.emergency_contacts) {
      residentData.emergency_contacts = data.emergency_contacts.map(
        (contact) => ({
          work_phone: contact.work_phone ?? null, // Changed
          home_phone: contact.home_phone ?? null, // Changed
          contact_name: contact.contact_name ?? null, // Changed
          relationship: contact.relationship ?? null, // Changed
          cell_phone: contact.cell_phone, // Changed
        }),
      )
    } else {
      residentData.emergency_contacts = null
    }

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
      form.reset({ resident_name: '', emergency_contacts: [] }) // Changed
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
