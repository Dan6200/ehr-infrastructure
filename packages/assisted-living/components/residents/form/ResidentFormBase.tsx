'use client'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { Form } from '#/components/ui/form'
import { EditableFormField } from './EditableFormField'
import { UploadButton } from '#/components/cloudinary/upload-button'
import { useEffect, useState } from 'react'
import { getAllFacilities } from '#/actions/residents/get'
import { Facility } from '#/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { EmergencyContactBlock } from './EmergencyContactBlock'
import { Plus, Minus } from 'lucide-react'
import { v4 as uuid } from 'uuid'

interface ResidentFormBaseProps {
  form: ReturnType<typeof useForm<any>>
  onSubmit: (data: any) => Promise<void>
  formTitle: string | React.ReactNode
  isEditableByDefault: boolean
  handleUpload: (result: any) => void
  includeEmergencyContacts?: boolean
}

export function ResidentFormBase({
  form,
  onSubmit,
  isEditableByDefault,
  formTitle,
  handleUpload,
  includeEmergencyContacts = false,
}: ResidentFormBaseProps) {
  const [facilities, setFacilities] = useState<Facility[]>([])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'emergency_contacts',
  })

  useEffect(() => {
    async function fetchFacilities() {
      const facs = await getAllFacilities()
      setFacilities(facs)
    }
    fetchFacilities()
  }, [])

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
          description="Resident's Name."
          isInputDisabled={!isEditableByDefault}
        />
        <Controller
          control={form.control}
          name="facility_id"
          render={({ field }) => (
            <EditableFormField
              name={field.name}
              label="Facility"
              description="Select the resident's facility."
              isInputDisabled={!isEditableByDefault}
              renderInput={(fieldProps) => (
                <Select
                  {...fieldProps}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a facility..." />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((fac) => (
                      <SelectItem key={fac.id} value={fac.id!}>
                        {fac.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        />
        <EditableFormField
          name="dob"
          label="Date of Birth"
          description="Resident's Date of Birth."
          isInputDisabled={!isEditableByDefault}
        />
        <EditableFormField
          name="pcp"
          label="Primary Care Physician"
          description="Resident's PCP."
          isInputDisabled={!isEditableByDefault}
        />
        <EditableFormField
          name="resident_email"
          label="Email"
          description="Resident's Email Address."
          isInputDisabled={!isEditableByDefault}
        />
        <EditableFormField
          name="cell_phone"
          label="Cell Phone"
          description="Resident's Cell Phone."
          isInputDisabled={!isEditableByDefault}
        />
        <EditableFormField
          name="work_phone"
          label="Work Phone"
          description="Resident's Work Phone."
          isInputDisabled={!isEditableByDefault}
        />
        <EditableFormField
          name="home_phone"
          label="Home Phone"
          description="Resident's Home Phone."
          isInputDisabled={!isEditableByDefault}
        />
        <div className="flex w-full">
          <UploadButton onUpload={handleUpload} />
        </div>

        {includeEmergencyContacts && (
          <>
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
                      legal_relationships: [],
                      personal_relationships: [],
                      id: uuid(),
                    })
                  }
                  className={`p-1 border hover:bg-accent text-accent-foreground rounded-md cursor-pointer`}
                >
                  <Plus />
                </span>
                {fields.length > 0 && (
                  <span
                    onClick={() => remove(fields.length - 1)}
                    className={`p-1 border hover:bg-accent text-accent-foreground rounded-md cursor-pointer`}
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
                onDelete={() => remove(i)}
              />
            ))}
          </>
        )}

        <Button type="submit" className="w-full sm:w-[10vw]">
          Submit
        </Button>
      </form>
    </Form>
  )
}
