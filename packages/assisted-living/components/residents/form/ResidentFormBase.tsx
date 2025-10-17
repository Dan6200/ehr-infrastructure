'use client'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { EditableFormField } from './EditableFormField'
import { UploadButton } from '@/components/cloudinary/upload-button'

interface ResidentFormBaseProps {
  form: ReturnType<typeof useForm<any>>
  onSubmit: (data: any) => Promise<void>
  formTitle: string | React.ReactNode
  isResidentNameEditableByDefault: boolean // Renamed from alwaysEditable
  handleUpload: (result: any) => void
}

export function ResidentFormBase({
  form,
  onSubmit,
  isResidentNameEditableByDefault,
  formTitle,
  handleUpload,
}: ResidentFormBaseProps) {
  return (
    <Form {...form}>
      <h1 className="font-semibold mb-8 text-2xl ">{formTitle}</h1>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full sm:w-4/5 lg:w-3/4 space-y-6"
      >
        <EditableFormField
          name="resident_name"
          label="Name"
          description="Residents Name."
          isInputDisabled={!isResidentNameEditableByDefault} // Pass as isInputDisabled
        />
        <div className="flex w-full">
          <UploadButton onUpload={handleUpload} />
        </div>
        <Button type="submit" className="w-full sm:w-[10vw]">
          Submit
        </Button>
      </form>
    </Form>
  )
}
