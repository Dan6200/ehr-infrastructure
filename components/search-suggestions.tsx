export {};
//import { Card, CardContent } from "@/components/ui/card";
//import type { Resident } from "@/types";
//import Link from "next/link";
//import { X } from "lucide-react";
//import { Dispatch, SetStateAction } from "react";
//
//export const SearchSuggestions = ({
//  matchingResidents,
//  setOpen,
//}: {
//  matchingResidents: Resident[];
//  setOpen: Dispatch<SetStateAction<boolean>>;
//}) => {
//  return (
//    <Card className="mt-4 py-0 w-full mx-auto">
//      <div className="w-11/12 relative mx-auto ">
//        <span
//          onClick={() => setOpen(!open)}
//          className="bg-foreground absolute top-0 right-0 rounded-md"
//        >
//          <X className="text-background" />
//        </span>
//        <CardContent className="my-4 px-0 flex flex-col overflow-y-scroll max-h-[80vh] md:max-h-[60vh] gap-2">
//          {matchingResidents.length ? (
//            matchingResidents.map((resident) => (
//              <Link
//                className="text-left cursor-pointer active:bg-primary/10 hover:bg-primary/10 bg-muted w-full rounded-md p-2 text-nowrap align-bottom"
//                href={`/room/${resident.id}`}
//                key={resident.id}
//              >
//                <p className="font-semibold">{resident.name}</p>
//                <p>{resident.address}</p>
//                <p className="text-sm font-semibold">
//                  Rm: {resident.unit_number}
//                </p>
//              </Link>
//            ))
//          ) : (
//            <div className="text-left text-muted-foreground">
//              Resident Not Found
//            </div>
//          )}
//        </CardContent>
//      </div>
//    </Card>
//  );
//};
