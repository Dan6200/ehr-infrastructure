'use client'
import { useForm, useFieldArray } from 'react-hook-form'
import { v4 as uuid } from 'uuid'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Minus, Plus } from 'lucide-react'
import { EditableFormField } from './EditableFormField'
import { EmergencyContactBlock } from './EmergencyContactBlock'

interface ResidentFormBaseProps {
  form: ReturnType<typeof useForm<any>>
  onSubmit: (data: any) => Promise<void>
  formTitle: string | React.ReactNode
  isResidentNameEditableByDefault: boolean // Renamed from alwaysEditable
  originalNoOfEmContacts: number
}

export function ResidentFormBase({
  form,
  onSubmit,
  isResidentNameEditableByDefault,
  formTitle,
  originalNoOfEmContacts,
}: ResidentFormBaseProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'emergencyContacts',
  })

  const handleRemoveEmergencyContact = (indexToRemove: number) => {
    remove(indexToRemove)
  }

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
        <div className="flex justify-end border-b w-full">
          <h4 className="gap-2 flex items-center pb-4">
            {(fields.length < 1 ? 'Add ' : '') + 'Emergency Contacts'}
            <span
              onClick={() =>
                append({
                  contact_name: '',
                  cell_phone: '',
                  home_phone: '',
                  work_phone: '',
                  relationship: '',
                  id: uuid(),
                })
              }
              className={`p-1 border hover:bg-primary/10 rounded-md cursor-pointer`}
            >
              <Plus />
            </span>
            {fields.length > originalNoOfEmContacts && (
              <span
                onClick={() => remove(fields.length - 1)}
                className={`p-1 border hover:bg-primary/10 rounded-md cursor-pointer`}
              >
                <Minus />
              </span>
            )}
          </h4>
        </div>
        {fields.map((field, i) => (
          <EmergencyContactBlock
            key={field.id}
            index={i}
            onDelete={handleRemoveEmergencyContact}
          />
        ))}
        <Button type="submit" className="w-full sm:w-[10vw]">
          Submit
        </Button>
      </form>
    </Form>
  )
}
