export {}
//"use client";
//import { SearchBar } from "@/components/search-bar";
//import { useLayoutEffect, useState } from "react";
//import type { Resident } from "@/types";
//import { SearchSuggestions } from "../search-suggestions";
//import { redirect } from "next/navigation";
//import { useAtomValue } from "jotai";
//import userAtom from "@/atoms/user";
//
//interface SearchProps {
//  residents: Resident[];
//}
//
//export default function Search({ residents }: SearchProps) {
//  const [matchingResidents, setMatchingResidents] = useState<null | Resident[]>(
//    null
//  );
//  const admin = useAtomValue(userAtom);
//  const [open, setOpen] = useState(true);
//
//  useLayoutEffect(() => {
//    setTimeout(() => {
//      if (!admin) {
//        redirect("/");
//      }
//    }, 500);
//  }, [admin]);
//
//  return (
//    <main className="w-full sm:w-4/5 md:w-3/5 px-[5vw] sm:px-8 mx-auto py-8 h-[200vh] md:max-h-screen">
//      <SearchBar {...{ residents, setMatchingResidents, setOpen }} />
//      {matchingResidents && open && (
//        <SearchSuggestions {...{ matchingResidents, setOpen }} />
//      )}
//    </main>
//  );
//}
