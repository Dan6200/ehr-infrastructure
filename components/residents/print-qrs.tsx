//cspell:ignore jspdf qrcode svgs
/*
 * I used route handlers instead...
 *
"use client";
import { svgToPngDataURL } from "@/app/utils";
import { Resident } from "@/types";
import jsPDF from "jspdf";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useRef, useLayoutEffect, useEffect } from "react";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";

const PrintQRs = ({ AllResidents }: { AllResidents: Resident[] }) => {
  useLayoutEffect(() => {
    toast({ title: "This may take a moment..." });
    const qrSvgs = Array.from(document.querySelectorAll(".qrSvg"));
    const worker = new Worker("/pdfWorker.js");
    worker.postMessage({
      canvasWidth: 150,
      canvasHeight: 150,
      qrSvgData: qrSvgs.map((svg: Element) => svg.outerHTML),
    });
    worker.onmessage = function (e) {
      const { pdfBlob } = e.data;
      console.log(pdfBlob);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = "Resident's QR Code";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(pdfUrl);
    };
    return () => worker.terminate();
  }, []);

  return (
    <main className="bg-background flex items-center justify-center container w-full py-32 md:w-2/3">
      <section className="flex flex-col gap-8 sm:gap-32 md:gap-32 lg:gap-48">
        {AllResidents.map(({ id }: { id: string }) => (
          <QRCodeSVG
            key={id}
            value={new URL(
              `/residents/${id}`,
              process.env.NEXT_PUBLIC_DOMAIN
            ).toString()}
            size={500}
            className="w-[80vw] qrSvg"
          />
        ))}
      </section>
    </main>
  );
};
 */
export {}
