"use client";
import { Card, CardContent } from "@/components/ui/card";
import type { Facility } from "@/types";
import Link from "next/link";
import { Dispatch, SetStateAction } from "react";

interface SuggestionProps {
  matchingRooms: (Facility & { document_id: string })[];
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const Suggestions = ({ matchingRooms, setOpen }: SuggestionProps) => {
  return (
    <Card className="disable-scrollbars absolute mt-4 py-0 w-full md:w-2/5 md:left-1/3 left-0">
      <div className="w-11/12 relative mx-auto ">
        <CardContent className="my-4 px-0 flex flex-col overflow-y-scroll max-h-[80vh] md:max-h-[40vh] gap-2">
          {matchingRooms.length ? (
            matchingRooms.map((room) => (
              <Link
                className="text-left cursor-pointer active:bg-primary/10 hover:bg-primary/10 bg-muted w-full rounded-md p-2 text-nowrap align-bottom"
                href={`/room/${room.document_id}`}
                key={room.document_id}
                onClick={() => setOpen(false)}
              >
                <p className="font-semibold">{room.facility_id}</p>
                <p>{room.address}</p>
                <p className="text-sm font-semibold">Rm: {room.roomNo}</p>
              </Link>
            ))
          ) : (
            <div className="text-left text-muted-foreground">
              Resident Not Found
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};
