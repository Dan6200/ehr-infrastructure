"use client";
import React, {
  MouseEventHandler,
  MouseEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Plus,
  QrCode,
  SearchIcon,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import Search from "./search/index";
import { Facility } from "@/types";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/client/config";
import { signOutWrapper } from "@/firebase/auth/actions";

export default function Header({
  rooms,
}: {
  rooms: (Facility & { document_id: string })[] | null;
}) {
  const router = useRouter();

  const handleSignOut: MouseEventHandler<HTMLButtonElement> = async (
    event: MouseEvent,
  ) => {
    event.preventDefault();
    signOutWrapper();
  };

  const [admin, setAdmin] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAdmin(currentUser);
      if (
        !currentUser &&
        pathname !== "/admin/sign-in" &&
        !pathname.includes("residents") &&
        !pathname.includes("room")
      )
        router.push("/admin/sign-in");
    });
    return () => unsubscribe();
  }, [pathname, setAdmin]);

  return (
    <header
      className={`fixed w-full z-10 bg-background/80 ${
        admin ? "justify-between" : "md:gap-[21%]"
      } gap-2 flex flex-wrap border-b items-center px-4 py-2`}
    >
      <Link href="/" className="w-fit">
        <Image
          priority
          width={100}
          height={100}
          src="/client-logo-small.png"
          alt="LinkId logo"
          className="block md:hidden flex-1"
        />
        <Image
          priority
          width={150}
          height={150}
          src="/client-logo-large.jpeg"
          alt="LinkId logo"
          className="hidden md:block"
        />
      </Link>
      {admin && rooms && (
        <Search className="w-full md:w-2/5 order-2 md:order-1" {...{ rooms }} />
      )}
      {admin && (
        <DropdownMenu>
          <div className="flex justify-end order-1 md:order-2">
            <DropdownMenuTrigger className="rounded-full border-primary border-4 bg-primary-foreground w-12 h-12">
              <UserRound className="mx-auto" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="text-center gap-5 p-2 md:gap-5 bg-background border-2 mr-4 w-[60vw] sm:w-[40vw] md:w-[30vw] lg:w-[20vw]">
              <DropdownMenuLabel>Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <span
                    onClick={() => router.push("/")}
                    className="cursor-pointer h-9 items-center flex justify-between mx-auto w-full"
                  >
                    All Residents
                    <SearchIcon className="w-4 mr-2" />
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span
                    onClick={() => router.push("/admin/new")}
                    className="cursor-pointer h-9 items-center flex justify-between mx-auto w-full"
                  >
                    Add New Admin
                    <UserRoundPlus className="w-6" />
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a
                    onMouseDown={() => {
                      toast({ title: "Printing QR Codes..." });
                    }}
                    href={process.env.NEXT_PUBLIC_QR_PRINT_URL!}
                    download
                    className="cursor-pointer h-9 items-center flex justify-between capitalize mx-auto w-full"
                  >
                    Print QR Codes
                    <QrCode className="w-6" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Button onClick={handleSignOut} className="w-full mx-auto">
                    Sign Out
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </div>
        </DropdownMenu>
      )}
    </header>
  );
}
