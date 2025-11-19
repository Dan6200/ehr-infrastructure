'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '#/auth/client/config'

import { toast } from '#/components/ui/use-toast'
import { isError } from '#/app/utils'
import { updateResident } from '#/actions/residents/update'
import { ResidentFormBase } from './ResidentFormBase'
import { type ResidentData, ResidentDataSchema } from '#/types'

export function ResidentFormEdit({
  ...residentData
}: Omit<ResidentData, 'address'>) {
  const router = useRouter()
  const [idToken, setIdToken] = useState<string | null>(null)
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null)

  const {
    id,
    resident_name,
    dob,
    pcp,
    resident_email,
    facility_id,
    cell_phone,
    work_phone,
    home_phone,
  } = residentData

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

  const form = useForm<Omit<ResidentData, 'emergency_contacts'>>({
    resolver: zodResolver(
      ResidentDataSchema.omit({ emergency_contacts: true }),
    ),
    defaultValues: {
      resident_name: resident_name ?? undefined,
      dob: dob ?? undefined,
      pcp: pcp ?? undefined,
      resident_email: resident_email ?? undefined,
      cell_phone: cell_phone ?? undefined,
      work_phone: work_phone ?? undefined,
      home_phone: home_phone ?? undefined,
      facility_id: facility_id ?? undefined,
    },
  })

  async function onSubmit(
    data: Omit<z.infer<typeof ResidentDataSchema>, 'emergency_contacts'>,
  ) {
    if (!idToken) {
      toast({
        title: 'Authentication Error',
        description: 'User not authenticated. Please log in again.',
        variant: 'destructive',
      })
      return
    }

    let residentUpdateData: Partial<ResidentData> = {
      resident_name: data.resident_name ?? null,
      dob: data.dob ?? null,
      pcp: data.pcp ?? null,
      resident_email: data.resident_email ?? null,
      cell_phone: data.cell_phone ?? null,
      work_phone: data.work_phone ?? null,
      home_phone: data.home_phone ?? null,
      facility_id: facility_id ?? null,
    }
    if (newAvatarUrl) {
      residentUpdateData.avatar_url = newAvatarUrl
    }

    try {
      if (!residentData.id) throw new Error("Can't find the resource to edit")
      const { message, success } = await updateResident(residentUpdateData, id)
      toast({
        title: message,
        variant: success ? 'default' : 'destructive',
      })
      if (success) {
        router.refresh()
      }
    } catch (err) {
      if (isError(err)) toast({ title: err.message, variant: 'destructive' })
    }
  }

  const handleUpload = (result: any) => {
    setNewAvatarUrl(result.info.secure_url)
    toast({ title: 'Image uploaded successfully!' })
  }

  return (
    <ResidentFormBase
      form={form}
      onSubmit={onSubmit}
      formTitle="Edit Resident Information"
      isEditableByDefault={false}
      handleUpload={handleUpload}
      includeEmergencyContacts={false}
    />
  )
}
