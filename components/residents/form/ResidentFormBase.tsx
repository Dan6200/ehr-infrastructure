"use client";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Minus, Plus } from "lucide-react";
import { Dispatch, SetStateAction, useRef } from "react";
import { EditableFormField } from "./EditableFormField";
import { EmergencyContactBlock } from "./EmergencyContactBlock";

interface ResidentFormBaseProps {
  form: ReturnType<typeof useForm<any>>;
  noOfEmContacts: number;
  setNoOfEmContacts: Dispatch<SetStateAction<number>>;
  onSubmit: (data: any) => Promise<void>;
  formTitle: string | React.ReactNode;
  alwaysEditable: boolean;
}

export function ResidentFormBase({
  form,
  noOfEmContacts,
  setNoOfEmContacts,
  onSubmit,
  alwaysEditable,
  formTitle,
}: ResidentFormBaseProps) {
  const originalNoOfEmContacts = useRef(noOfEmContacts);

  const handleRemoveEmergencyContact = (indexToRemove: number) => {
    const currentContacts = form.getValues("emergencyContacts") || [];
    const updatedContacts = currentContacts.filter(
      (_: any, i: number) => i !== indexToRemove,
    );
    form.setValue("emergencyContacts", updatedContacts);
    setNoOfEmContacts(updatedContacts.length);
  };

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
          alwaysEditable={alwaysEditable}
        />
        <div className="flex justify-end border-b w-full">
          <h4 className="gap-2 flex items-center pb-4">
            {(noOfEmContacts < 1 ? "Add " : "") + "Emergency Contacts"}
            <span
              onClick={() =>
                setNoOfEmContacts(
                  noOfEmContacts < 10 ? noOfEmContacts + 1 : noOfEmContacts,
                )
              }
              className={`p-1 border hover:bg-primary/10 rounded-md cursor-pointer`}
            >
              <Plus />
            </span>
            {noOfEmContacts > originalNoOfEmContacts.current && (
              <span
                onClick={() =>
                  setNoOfEmContacts(
                    noOfEmContacts > originalNoOfEmContacts.current
                      ? noOfEmContacts - 1
                      : noOfEmContacts,
                  )
                }
                className={`p-1 border hover:bg-primary/10 rounded-md cursor-pointer`}
              >
                <Minus />
              </span>
            )}
          </h4>
        </div>
        {noOfEmContacts > 0 &&
          new Array(noOfEmContacts)
            .fill(null)
            .map((_, i) => (
              <EmergencyContactBlock
                key={i}
                index={i}
                onDelete={handleRemoveEmergencyContact}
              />
            ))}
        <Button type="submit" className="w-full sm:w-[10vw]">
          Submit
        </Button>
      </form>
    </Form>
  );
}

