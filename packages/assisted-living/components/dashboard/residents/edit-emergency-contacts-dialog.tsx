'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { EmergencyContact } from '@/types'
import { EmergencyContactsFormEdit } from '@/components/residents/form/EmergencyContactsFormEdit'

interface EditEmergencyContactsDialogProps {
  documentId: string
  contacts: EmergencyContact[] | null | undefined
}

export function EditEmergencyContactsDialog({
  documentId,
  contacts,
}: EditEmergencyContactsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const handleFinished = () => {
    setOpen(false)
  }

  const initialContacts = contacts || []

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button>Edit Emergency Contacts</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Emergency Contacts</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto max-h-[80vh]">
            <EmergencyContactsFormEdit
              documentId={documentId}
              initialContacts={initialContacts}
              onFinished={handleFinished}
            />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Edit Emergency Contacts</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Emergency Contacts</DialogTitle>
        </DialogHeader>
        <EmergencyContactsFormEdit
          documentId={documentId}
          initialContacts={initialContacts}
          onFinished={handleFinished}
        />
      </DialogContent>
    </Dialog>
  )
}
