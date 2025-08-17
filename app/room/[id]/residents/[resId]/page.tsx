import { notFound, redirect } from "next/navigation";
import { getResidentData } from "@/app/admin/residents/actions/get";
import { ResidentSchema } from "@/types/resident";
import Resident from "@/components/resident";
import { GoBackLink } from "@/components/go-back-link";

export default async function ResidentPage({
  params: { id, resId },
}: {
  params: { id: string; resId: string };
}) {
  const residentData = await getResidentData(resId).catch((e) => {
    if (e.message.match(/not_found/i)) throw notFound();
    if (e.message.match(/insufficient permissions/)) redirect("/admin/sign-in");
    throw new Error(
      `Unable to pass props to Resident Component -- Tag:22.\n\t${e}`,
    );
  });
  try {
    ResidentSchema.parse(residentData);
  } catch (error: any) {
    throw new Error("Invalid Resident Data -- Tag:30: " + error.message);
  }
  return (
    <main className="bg-background flex flex-col gap-5 container md:px-16 mx-auto text-center py-16 sm:py-24 lg:py-32 h-fit">
      <GoBackLink
        url={`/room/${id}/`}
        className="cursor-pointer text-blue-700 flex w-full sm:w-3/5 gap-2 sm:gap-5"
        refresh
      >
        Go To Previous Page
      </GoBackLink>
      <Resident {...{ residentData, resId }} />;
    </main>
  );
}
