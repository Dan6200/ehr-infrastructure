'use client'

import * as React from 'react'
import { useIsMobile } from '#root/hooks/use-mobile'
import { Button } from '#root/components/ui/button'
import { ResidentFormEdit } from '#root/components/residents/form/ResidentFormEdit'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#root/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '#root/components/ui/drawer'
import { Resident } from '#root/types'

export function EditResidentDialog({
  residentData,
}: {
  residentData: Resident
}) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const handleFinished = () => {
    setOpen(false)
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button>Edit Information</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Resident Information</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto max-h-[80vh]">
            <ResidentFormEdit {...residentData} onFinished={handleFinished} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Edit Information</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Resident Information</DialogTitle>
        </DialogHeader>
        <ResidentFormEdit {...residentData} onFinished={handleFinished} />
      </DialogContent>
    </Dialog>
  )
}
