'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/auth/client/config'

import { toast } from '@/components/ui/use-toast'
import { isError } from '@/app/utils'
import { updateResident } from '@/actions/residents/update'
import { ResidentFormBase } from './ResidentFormBase'
import { type ResidentData, ResidentDataSchema } from '@/types'

export function ResidentFormEdit({
  onFinished,
  ...residentData
}: Omit<ResidentData, 'address'> & { onFinished: () => void }) {
  const { resident_name, id, facility_id } = residentData
  const router = useRouter()
  const [idToken, setIdToken] = useState<string | null>(null)
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null)

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

    let residentUpdateData: Partial<ResidentData> = {}
    residentUpdateData.resident_name = data.resident_name ?? null
    if (newAvatarUrl) {
      residentUpdateData.avatar_url = newAvatarUrl
    }

    try {
      if (!id) throw new Error("Can't find the resource to edit")
      const { message, success } = await updateResident(residentUpdateData, id)
      toast({
        title: message,
        variant: success ? 'default' : 'destructive',
      })
      if (success) {
        router.refresh()
        onFinished()
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
      isResidentNameEditableByDefault={false}
      handleUpload={handleUpload}
    />
  )
}
