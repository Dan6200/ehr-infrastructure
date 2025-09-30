"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Added imports

import { toast } from "@/components/ui/use-toast";
import { isError } from "@/app/utils";
import { addNewResident } from "@/app/admin/residents/actions/add";
import { ResidentFormBase } from "./ResidentFormBase";
import type { Resident } from "@/types";

const emergencyContactSchema = z.object({
  encrypted_contact_name: z
    .string()
    .min(3, {
      message: "contact name must be at least 3 characters.",
    })
    .nullable()
    .optional(),
  encrypted_cell_phone: z.string(),
  encrypted_home_phone: z.string().nullable().optional(),
  encrypted_work_phone: z.string().nullable().optional(),
  encrypted_relationship: z.string().nullable().optional(),
});

const ResidentFormSchema = z.object({
  encrypted_resident_name: z.string().nullable(),
  emergencyContacts: z.array(emergencyContactSchema).nullable().optional(),
});

interface ResidentFormAddProps {
  facility_id: string;
}

export function ResidentFormAdd({ facility_id }: ResidentFormAddProps) {
  const [idToken, setIdToken] = useState<string | null>(null); // State to hold idToken

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<z.infer<typeof ResidentFormSchema>>({
    resolver: zodResolver(ResidentFormSchema),
    defaultValues: {
      encrypted_resident_name: "", // Changed from resident_name
      emergencyContacts: [],
    },
  });

  async function onSubmit(data: z.infer<typeof ResidentFormSchema>) {
    if (!idToken) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    let residentData: Resident = {} as Resident;
    residentData.encrypted_resident_name = data.encrypted_resident_name ?? null; // Changed from resident_name
    residentData.facility_id = facility_id;

    if (data.emergencyContacts) {
      residentData.emergencyContacts = data.emergencyContacts.map(
        (contact) => ({
          encrypted_work_phone: contact.encrypted_work_phone ?? null, // Changed
          encrypted_home_phone: contact.encrypted_home_phone ?? null, // Changed
          encrypted_contact_name: contact.encrypted_contact_name ?? null, // Changed
          encrypted_relationship: contact.encrypted_relationship ?? null, // Changed
          encrypted_cell_phone: contact.encrypted_cell_phone, // Changed
        }),
      );
    } else {
      residentData.emergencyContacts = null;
    }

    try {
      const { message, success } = await addNewResident(residentData, idToken); // Pass idToken
      if (!success) {
        toast({
          title: success ? "Unable to Add New Resident" : message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: message });
      form.reset({ encrypted_resident_name: "", emergencyContacts: [] }); // Changed
    } catch (err) {
      if (isError(err)) toast({ title: err.message, variant: "destructive" });
    }
  }

  return (
    <ResidentFormBase
      form={form}
      onSubmit={onSubmit}
      formTitle="Add A New Resident"
      isResidentNameEditableByDefault={true}
      originalNoOfEmContacts={0}
    />
  );
}
