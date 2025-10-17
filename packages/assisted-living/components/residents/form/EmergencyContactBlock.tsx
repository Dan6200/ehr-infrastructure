'use client'
import { useFormContext, Controller } from 'react-hook-form'
import { Edit, Lock, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { EditableFormField } from './EditableFormField'
import { LegalRelationshipEnum, PersonalRelationshipEnum } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface EmergencyContactBlockProps {
  index: number
  onDelete: (index: number) => void
}

export function EmergencyContactBlock({
  index,
  onDelete,
}: EmergencyContactBlockProps) {
  const { getValues, control } = useFormContext()

  const initialIsEmContactBlockEditing = () => {
    const contactPath = `emergency_contacts.${index}`
    const contact = getValues(contactPath)
    return (
      !contact?.contact_name &&
      !contact?.cell_phone &&
      !contact?.home_phone &&
      !contact?.work_phone &&
      !contact?.legal_relationships?.length &&
      !contact?.personal_relationships?.length
    )
  }

  const [isEmContactBlockEditing, setIsEmContactBlockEditing] = useState(
    initialIsEmContactBlockEditing,
  )

  return (
    <div className="mb-8 border-b py-4">
      <h3 className="font-semibold mb-8 flex items-center justify-between">
        Emergency Contact {index > 0 ? index + 1 : ''}
        <div className="flex gap-2">
          <span
            onClick={() => setIsEmContactBlockEditing(!isEmContactBlockEditing)}
            className="p-1 border hover:bg-primary/10 rounded-md cursor-pointer"
          >
            {!isEmContactBlockEditing ? <Edit /> : <Lock />}
          </span>
          {isEmContactBlockEditing && (
            <span
              onClick={() => onDelete(index)}
              className="p-1 border hover:bg-primary/10 rounded-md cursor-pointer"
            >
              <Trash2 />
            </span>
          )}
        </div>
      </h3>
      <div className="space-y-6">
        <EditableFormField
          name={`emergency_contacts.${index}.contact_name`}
          label="Name"
          description="Emergency Contact's Name"
          isInputDisabled={!isEmContactBlockEditing}
          showLocalEditingControls={false}
        />

        <Controller
          control={control}
          name={`emergency_contacts.${index}.personal_relationships`}
          render={({ field }) => (
            <EditableFormField
              name={field.name}
              label="Personal Relationship"
              description="Select the personal relationship(s)."
              isInputDisabled={!isEmContactBlockEditing}
              showLocalEditingControls={false}
              renderInput={(fieldProps) => (
                <Select
                  {...fieldProps}
                  multiple
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger disabled={!isEmContactBlockEditing}>
                    <SelectValue placeholder="Select personal relationships..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PersonalRelationshipEnum.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        />

        <Controller
          control={control}
          name={`emergency_contacts.${index}.legal_relationships`}
          render={({ field }) => (
            <EditableFormField
              name={field.name}
              label="Legal Relationship"
              description="Select the legal relationship(s)."
              isInputDisabled={!isEmContactBlockEditing}
              showLocalEditingControls={false}
              renderInput={(fieldProps) => (
                <Select
                  {...fieldProps}
                  multiple
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger disabled={!isEmContactBlockEditing}>
                    <SelectValue placeholder="Select legal relationships..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LegalRelationshipEnum.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        />

        <EditableFormField
          name={`emergency_contacts.${index}.cell_phone`}
          label="Cell Phone"
          description="Emergency Contact's Cell Phone Number"
          isInputDisabled={!isEmContactBlockEditing}
          showLocalEditingControls={false}
        />
        <EditableFormField
          name={`emergency_contacts.${index}.home_phone`}
          label="Home Phone"
          description="Emergency Contact's Home Phone Number"
          isInputDisabled={!isEmContactBlockEditing}
          showLocalEditingControls={false}
        />
        <EditableFormField
          name={`emergency_contacts.${index}.work_phone`}
          label="Work Phone"
          description="Emergency Contact's Work Phone Number"
          isInputDisabled={!isEmContactBlockEditing}
          showLocalEditingControls={false}
        />
      </div>
    </div>
  )
}
