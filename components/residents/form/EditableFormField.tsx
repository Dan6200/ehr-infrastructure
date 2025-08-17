"use client";
import { useState } from "react";
import { Edit, Lock } from "lucide-react";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface EditableFormFieldProps {
  name: string;
  label: string;
  description: string;
  alwaysEditable: boolean;
  isEmContactBlockEditing?: boolean;
  renderInput?: (field: any, disabled: boolean) => React.ReactNode; // Custom input render
}

export function EditableFormField({
  name,
  label,
  description,
  alwaysEditable,
  renderInput,
  isEmContactBlockEditing = true,
}: EditableFormFieldProps) {
  const { control, getValues, setValue } = useFormContext();
  const [isFieldEditing, setIsFieldEditing] = useState(alwaysEditable);

  const isDisabled = !isFieldEditing || !isEmContactBlockEditing;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            <div className="flex gap-2">
              {!alwaysEditable && (
                <span
                  onClick={() => setIsFieldEditing(!isFieldEditing)}
                  className="p-1 border hover:bg-primary/10 rounded-md cursor-pointer"
                >
                  {!isFieldEditing ? <Edit /> : <Lock />}
                </span>
              )}
            </div>
          </div>
          <FormControl>
            {renderInput ? (
              renderInput(field, isDisabled)
            ) : (
              <Input
                {...field}
                value={field.value ?? ""}
                disabled={isDisabled}
                className={field.value ? "border-2 border-blue-500" : ""}
              />
            )}
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
