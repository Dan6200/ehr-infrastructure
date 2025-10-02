import jsPDF from 'jspdf'
import { NextRequest, NextResponse } from 'next/server'
import QRcode from 'qrcode'

export async function GET(
  req: NextRequest,
  { params: { url } }: { params: { url: string } },
) {
  const { searchParams } = req.nextUrl
  const unit_number = searchParams.get('unit_number')
  const address = searchParams.get('address')
  const doc = new jsPDF()
  const qrCodeDataUri = await QRcode.toDataURL(url)
  if (!(unit_number && address && url))
    throw new Error('Must provide Residents Details')
  doc.text(`Unit Number: ${unit_number}`, 30, 20)
  doc.text(`Address: ${address}`, 30, 35)
  doc.addImage(qrCodeDataUri, 'PNG', 30, 75, 150, 150)
  return new NextResponse(new Uint8Array(doc.output('arraybuffer')), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename="Residents Qr Code.pdf"',
    },
  })
}
