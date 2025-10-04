'use client'
import { useState, memo } from 'react'
import { Edit, Lock } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface EditableFormFieldProps {
  name: string
  label: string
  description: string
  isInputDisabled: boolean // Directly controls input disabled state
  showLocalEditingControls?: boolean // Controls visibility of local edit/lock icons
  renderInput?: (field: any, disabled: boolean) => React.ReactNode // Custom input render
}

export const EditableFormField = memo(function EditableFormField({
  name,
  label,
  description,
  isInputDisabled,
  showLocalEditingControls = true,
  renderInput,
}: EditableFormFieldProps) {
  const { control, getValues, setValue } = useFormContext()
  // isFieldEditing is only relevant if showLocalEditingControls is true
  const [isFieldEditing, setIsFieldEditing] = useState(
    showLocalEditingControls ? !isInputDisabled : true,
  )

  const isDisabled = showLocalEditingControls
    ? !isFieldEditing
    : isInputDisabled

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            {showLocalEditingControls && (
              <div className="flex gap-2">
                <span
                  onClick={() => setIsFieldEditing(!isFieldEditing)}
                  className="p-1 border hover:bg-primary/10 rounded-md cursor-pointer"
                >
                  {!isFieldEditing ? <Edit /> : <Lock />}
                </span>
              </div>
            )}
          </div>
          <FormControl>
            {renderInput ? (
              renderInput(field, isDisabled)
            ) : (
              <Input
                {...field}
                value={field.value ?? ''}
                disabled={isDisabled}
                className={field.value ? 'border-2 border-blue-500' : ''}
              />
            )}
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
})
