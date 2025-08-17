"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit } from "lucide-react";

import { toast } from "@/components/ui/use-toast";
import { isError } from "@/app/utils";
import { updateResident } from "@/app/admin/residents/actions/update";
import { ResidentFormBase } from "./ResidentFormBase";
import type { Resident, Nullable } from "@/types/resident";

const emergencyContactSchema = z.object({
  contact_name: z
    .string()
    .min(3, {
      message: "contact name must be at least 3 characters.",
    })
    .nullable()
    .optional(),
  cell_phone: z.string(),
  home_phone: z.string().nullable().optional(),
  work_phone: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
});

const ResidentFormSchema = z.object({
  resident_name: z.string().nullable(),
  emergencyContacts: z.array(emergencyContactSchema).nullable().optional(),
});

interface ResidentFormEditProps {
  resident_name?: Nullable<string>;
  document_id: string; // document_id is required for editing
  resident_id: string; // resident_id is required for editing
  residence_id: string;
  emergencyContacts?: Nullable<
    {
      contact_name?: Nullable<string>;
      cell_phone: string;
      home_phone?: Nullable<string>;
      work_phone?: Nullable<string>;
      relationship?: Nullable<string>;
    }[]
  >;
}

export function ResidentFormEdit({
  resident_name,
  document_id,
  resident_id,
  residence_id,
  emergencyContacts,
}: ResidentFormEditProps) {
  const router = useRouter();
  const [noOfEmContacts, setNoOfEmContacts] = useState(
    emergencyContacts?.length ?? 0,
  );

  const form = useForm<z.infer<typeof ResidentFormSchema>>({
    resolver: zodResolver(ResidentFormSchema),
    defaultValues: {
      resident_name: resident_name ?? undefined,
      emergencyContacts:
        emergencyContacts?.map(
          ({
            contact_name,
            cell_phone,
            home_phone,
            work_phone,
            relationship,
          }) => ({
            contact_name: contact_name ?? undefined,
            cell_phone,
            home_phone: home_phone ?? undefined,
            work_phone: work_phone ?? undefined,
            relationship: relationship ?? undefined,
          }),
        ) ?? [],
    },
  });

  async function onSubmit(data: z.infer<typeof ResidentFormSchema>) {
    let residentData: Resident = {} as Resident;
    residentData.resident_name = data.resident_name ?? null;
    residentData.residence_id = residence_id;
    residentData.resident_id = resident_id; // Use existing resident_id

    if (data.emergencyContacts) {
      residentData.emergencyContacts = data.emergencyContacts.map(
        (contact) => ({
          work_phone: contact.work_phone ?? null,
          home_phone: contact.home_phone ?? null,
          contact_name: contact.contact_name ?? null,
          relationship: contact.relationship ?? null,
          cell_phone: contact.cell_phone,
        }),
      );
    } else {
      residentData.emergencyContacts = null;
    }

    try {
      const { message, success } = await updateResident(
        residentData,
        document_id,
      );
      toast({
        title: message,
        variant: success ? "default" : "destructive",
      });
      router.back();
    } catch (err) {
      if (isError(err)) toast({ title: err.message, variant: "destructive" });
    }
  }

  return (
    <ResidentFormBase
      form={form}
      noOfEmContacts={noOfEmContacts}
      setNoOfEmContacts={setNoOfEmContacts}
      onSubmit={onSubmit}
      formTitle={
        <div className="flex items-center gap-2">Edit Resident Information</div>
      }
      alwaysEditable={false}
    />
  );
}
