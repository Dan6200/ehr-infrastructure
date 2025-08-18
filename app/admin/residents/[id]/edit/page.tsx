import { GoBackLink } from "@/components/go-back-link";
import { ResidentForm } from "@/components/residents/form";
import { getResidentData } from "../../actions/get";

export default async function EditResidentPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const residentData = await getResidentData(id);

  // Ensure document_id and resident_id are present for edit mode
  if (!residentData.document_id || !residentData.resident_id) {
    // Handle the case where data is incomplete for editing
    // For example, throw notFound() or redirect to an error page
    throw new Error("Resident data is incomplete for editing.");
  }

  return (
    <main className="flex flex-col gap-5 bg-background container w-full md:w-2/3 mx-auto py-32">
      <GoBackLink
        url={`/room/${residentData.document_id}/residents/${id}`}
        className="cursor-pointer text-blue-700 flex w-full sm:w-3/5 gap-2 sm:gap-5"
        refresh
      >
        Go To Previous Page
      </GoBackLink>
      <ResidentForm
        resident_name={residentData.resident_name}
        document_id={residentData.document_id}
        resident_id={residentData.resident_id}
        residence_id={residentData.residence_id}
        emergencyContacts={residentData.emergencyContacts}
      />
    </main>
  );
}
