'use client'

import { CldUploadWidget } from 'next-cloudinary'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'

interface CustomUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (result: any) => void
}

export function CustomUploadModal({
  isOpen,
  onClose,
  onUpload,
}: CustomUploadModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload New Avatar</DialogTitle>
          <DialogDescription>
            Choose a file from your device or provide a URL.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-8">
          <CldUploadWidget
            uploadPreset="ml_default"
            options={{ sources: ['local', 'url'] }}
            onSuccess={(result, { widget }) => {
              onUpload(result)
              widget.close()
            }}
          >
            {({ open }) => {
              return <Button onClick={() => open()}>Choose File</Button>
            }}
          </CldUploadWidget>
        </div>
      </DialogContent>
    </Dialog>
  )
}
