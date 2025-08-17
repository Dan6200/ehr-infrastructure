import { GoBackLink } from "@/components/go-back-link";
import { ResidentForm } from "@/components/residents/form";
import { getResidentData } from "../../actions/get";

export default async function EditResidentPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const residentData = await getResidentData(id);
  return (
    <main className="flex flex-col gap-5 bg-background container w-full md:w-2/3 mx-auto py-32">
      <GoBackLink
        url={`/room/${residentData.document_id}/residents/${id}`}
        className="cursor-pointer text-blue-700 flex w-full sm:w-3/5 gap-2 sm:gap-5"
        refresh
      >
        Go To Previous Page
      </GoBackLink>
      <ResidentForm {...residentData} />
    </main>
  );
}
