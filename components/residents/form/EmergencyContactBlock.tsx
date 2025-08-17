"use client";
import { useFormContext } from "react-hook-form";
import { Edit, Lock, Trash2 } from "lucide-react";

import { EditableFormField } from "./EditableFormField";
import { useState } from "react";

interface EmergencyContactBlockProps {
  index: number;
  onDelete: (index: number) => void; // Callback to remove this contact
}

export function EmergencyContactBlock({
  index,
  onDelete,
}: EmergencyContactBlockProps) {
  const { getValues } = useFormContext();

  const initialIsEmContactBlockEditing = () => {
    const contactPath = `emergencyContacts.${index}`;
    const contact = getValues(contactPath);

    return (
      !contact?.contact_name &&
      !contact?.cell_phone &&
      !contact?.home_phone &&
      !contact?.work_phone &&
      !contact?.relationship
    );
  };

  const [isEmContactBlockEditing, setIsEmContactBlockEditing] = useState(
    initialIsEmContactBlockEditing,
  );
  return (
    <div className="mb-8 border-b py-4">
      <h3 className="font-semibold mb-8 flex items-center justify-between">
        Emergency Contact {index > 0 ? index + 1 : ""}
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
          name={`emergencyContacts.${index}.contact_name`}
          label="Name"
          description="Emergency Contact's Name"
          isEmContactBlockEditing={isEmContactBlockEditing}
          alwaysEditable
        />
        <EditableFormField
          name={`emergencyContacts.${index}.relationship`}
          label="Relationship"
          description="Emergency Contact's Relationship"
          isEmContactBlockEditing={isEmContactBlockEditing}
          alwaysEditable
        />
        <EditableFormField
          name={`emergencyContacts.${index}.cell_phone`}
          label="Cell Phone"
          description="Emergency Contact's Cell Phone Number"
          isEmContactBlockEditing={isEmContactBlockEditing}
          alwaysEditable
        />
        <EditableFormField
          name={`emergencyContacts.${index}.home_phone`}
          label="Home Phone"
          description="Emergency Contact's Home Phone Number"
          isEmContactBlockEditing={isEmContactBlockEditing}
          alwaysEditable
        />
        <EditableFormField
          name={`emergencyContacts.${index}.work_phone`}
          label="Work Phone"
          description="Emergency Contact's Work Phone Number"
          isEmContactBlockEditing={isEmContactBlockEditing}
          alwaysEditable
        />
      </div>
    </div>
  );
}
