"use client";
import Image from "next/image";
import type { Resident } from "@/types";
import { PhoneCall } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/client/config";

export default function Resident({
  resId,
  residentData,
}: {
  resId: string;
  residentData: Resident;
}) {
  const [admin, setAdmin] = useState<User | null>(null),
    router = useRouter();

  const { encrypted_resident_name, emergencyContacts } = residentData;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAdmin(currentUser);
    });
    return () => unsubscribe();
  }, [setAdmin]);

  const numContacts = emergencyContacts ? emergencyContacts.length : 0;

  let gridColsClass = "grid-cols-1"; // Default for small screens or single item

  if (numContacts >= 2) {
    gridColsClass = "grid-cols-1 md:grid-cols-2";
  }
  // } else if (numContacts >= 3) {
  //   gridColsClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  // }

  return (
    <div className="py-8 md:py-16 space-y-16 sm:space-y-18 md:space-y-24">
      <section className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8">
        <Image
          src="/profile.svg"
          alt="profile svg icon"
          className="border-[6px] border-black rounded-full"
          width={96}
          height={96}
        />
        <h1 className="text-5xl font-bold">{encrypted_resident_name}</h1>
      </section>
      <section className="space-y-12 sm:space-y-18">
        <h3 className="text-2xl font-bold">Contacts</h3>
        <section
          className={`grid ${gridColsClass} gap-6 w-full md:w-fit mx-auto`}
        >
          {emergencyContacts ? (
            emergencyContacts.map((contact: any, index: number) => (
              <Link
                key={index + contact.encrypted_contact_name.split(" ")[0]}
                href={`tel:${contact.encrypted_cell_phone}`}
                className="w-full sm:w-fit"
              >
                <Card className="justify-between hover:bg-green-700/10 active:bg-green-700/10 flex shadow-md p-4 w-full md:p-6 items-center md:h-[15vh] sm:w-[45vw] md:w-[30vw]">
                  <CardContent className="p-0 flex flex-col justify-between text-left ">
                    <h3 className="capitalize font-semibold md:text-xl">
                      {contact.encrypted_contact_name}
                    </h3>
                    {contact.encrypted_relationship && (
                      <p className="capitalize">{contact.encrypted_relationship}</p>
                    )}
                    {contact.encrypted_cell_phone && (
                      <p className="text-green-700 font-semibold">
                        {contact.encrypted_cell_phone}
                      </p>
                    )}
                    {contact.encrypted_home_phone && (
                      <p className="text-green-700 font-semibold">
                        {contact.encrypted_home_phone}
                      </p>
                    )}
                    {contact.encrypted_work_phone && (
                      <p className="text-green-700 font-semibold">
                        {contact.encrypted_work_phone}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="shrink p-2">
                    <span className="border-4 border-green-700 w-16 h-16 flex items-center rounded-full">
                      <PhoneCall className="text-green-700 font-bold mx-auto" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))
          ) : (
            <p>No Emergency Contacts On Record</p>
          )}
        </section>
      </section>
      {admin && (
        <section className="mt-32 flex justify-center flex-wrap gap-6 w-full md:w-4/5 lg:w-2/3 mx-auto">
          <Button
            className="sm:w-64"
            onMouseDown={() => router.push(`/admin/residents/${resId}/edit`)}
          >
            Edit Resident Information
          </Button>
        </section>
      )}
    </div>
  );
}
