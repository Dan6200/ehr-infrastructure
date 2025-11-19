'use client'

import * as React from 'react'
import { useIsMobile } from '#/hooks/use-mobile'
import { Button } from '#/components/ui/button'
import { ResidentFormEdit } from '#/components/residents/form/ResidentFormEdit'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '#/components/ui/drawer'
import { ResidentData } from '#/types'

export function EditResidentDialog({
  residentData,
}: {
  residentData: ResidentData
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
