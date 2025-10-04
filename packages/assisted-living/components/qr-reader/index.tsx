//"use client";
//import { toast } from "@/components/ui/use-toast";
//import { useEffect, useState } from "react";
//import { QrReader } from "react-qr-reader";
//import { CameraOff } from "lucide-react";
//import { useRouter } from "next/navigation";
//import debounce from "lodash.debounce";
//import axios from "axios";
//
//export default function QRFetchResidents() {
//  const [camOn, setCamOn] = useState(false),
//    [isQR, setIsQR] = useState(false),
//    [fetchResidentErr, setFetchResidentErr] = useState<string | null>(null);
//  let isSmallScreen = true;
//  if (typeof self !== "undefined") isSmallScreen = self.innerWidth < 1024;
//
//  const router = useRouter();
//  const Id = "qr-video";
//  // Set Fallback elements when camera does not show
//  useEffect(() => {
//    if (isSmallScreen) {
//      navigator.mediaDevices
//        .getUserMedia({
//          video: { facingMode: "environment" },
//        })
//        .then((stream) => setCamOn(stream.active));
//    }
//  }, []);
//  // Error Message to UI
//  useEffect(() => {
//    let debouncedFunc: any;
//    if (fetchResidentErr) {
//      console.log(fetchResidentErr);
//      toast({
//        title: fetchResidentErr,
//        variant: "destructive",
//      });
//      debouncedFunc = debounce(() => {
//        setIsQR(false);
//        setFetchResidentErr(null);
//      }, 3000);
//      debouncedFunc();
//    }
//    return () => debouncedFunc?.cancel();
//  }, [isQR, fetchResidentErr]);
//  return (
//    <main className="w-full px-4 md:w-1/2 mx-auto my-4">
//      <h1 className="text-3xl font-semibold">Scan Qr code</h1>
//      {camOn ? (
//        <QrReader
//          constraints={{ facingMode: "environment" }}
//          videoId={Id}
//          onResult={(result, error) => {
//            if (result) {
//              setIsQR(true);
//              try {
//                let url: URL | null = null;
//                try {
//                  url = new URL(result.getText());
//                } catch (e) {
//                  setFetchResidentErr("Resident's QR is Invalid: " + e);
//                  return;
//                }
//                if (!url) return;
//                axios(url.toString(), { method: "HEAD" })
//                  .then(() => {
//                    toast({
//                      title: "Retrieved Resident's Info",
//                    });
//                    router.push(url!.toString()); // may need need to use javascript to visit link if external
//                  })
//                  .catch((e) => {
//                    if (e.response?.status === 404) {
//                      setFetchResidentErr("Resident Does Not Exist: " + e);
//                      return;
//                    }
//                    setFetchResidentErr(
//                      "Failed to Retrieve Resident Info: " + e
//                    );
//                    return;
//                  });
//              } catch (e) {
//                console.error(e);
//              }
//            }
//            if (error) {
//            }
//          }}
//          className={
//            (isQR ? "bg-green-700 " : "bg-red-600 ") +
//            "transition-colors rounded-lg p-1 sm:p-2 md:p-3 flex items-center bg-green-700 my-4 bg-black-800 mx-auto"
//          }
//          containerStyle={{ height: "100%", width: "100%" }}
//          videoContainerStyle={{
//            height: "100%",
//            width: "100%",
//            rounded: "50px",
//          }}
//          videoStyle={{
//            height: "100%",
//            width: "100%",
//            objectFit: "cover",
//            rounded: "50px",
//          }}
//        />
//      ) : (
//        <div className="flex flex-col gap-5 border-4 my-4 p-6 sm:p-6 border-primary/80 md:p-8 h-[40vh] w-full rounded-md">
//          <CameraOff className="w-28 h-28 mx-auto" />
//          <p className="text-lg capitalize">
//            <span className="font-semibold">Camera is off.</span>
//            <span className="block">
//              {isSmallScreen
//                ? "Please turn on camera and refresh to scan QR code."
//                : "Only Available to Mobile phones and Tablets"}
//            </span>
//          </p>
//        </div>
//      )}
//    </main>
//  );
//}
