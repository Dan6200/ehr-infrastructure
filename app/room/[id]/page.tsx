// import { notFound, redirect } from "next/navigation";
// import Room from "@/components/room";
// import { getRoomData } from "@/app/admin/residents/actions/get";
//
// export default async function RoomPage({
//   params: { id },
// }: {
//   params: { id: string };
// }) {
//   const roomData = await getRoomData(id).catch((e) => {
//     if (e.message.match(/not_found/i)) throw notFound();
//     if (e.message.match(/insufficient permissions/)) redirect("/admin/sign-in");
//     throw new Error(
//       `Unable to pass props to Resident Component -- Tag:21.\n\t${e}`,
//     );
//   });
//   try {
//     RoomDataSchema.parse(roomData);
//   } catch (error: any) {
//     throw new Error("Invalid Room Data -- Tag:30: " + error.message);
//   }
//   return <Room {...{ roomData }}></Room>;
// }
