// api/pagos/pdf/route.ts
import { getConnection } from "@/lib/db"
import { uploadComprobantePDF } from "@/lib/s3"
import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id es requerido" }, { status: 400 })

    const pagoID = parseInt(id, 10)
    if (Number.isNaN(pagoID)) return NextResponse.json({ error: "id inválido" }, { status: 400 })

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("pagoID", pagoID)
      .query(`
        SELECT 
          p.PagoID,
          p.SocioID,
          p.MembresíaID,
          p.NumeroComprobante,
          p.FechaPago,
          p.MontoPago     AS Monto,
          p.MedioPago     AS MetodoPago,
          p.Concepto,
          s.Nombre,
          s.Apellido,
          s.RUT,
          s.Email,
          s.Telefono,
          pm.PlanID,
          pm.NombrePlan,
          pm.DuracionDias,
          m.FechaInicio,
          m.FechaVencimiento
        FROM Pagos p
        INNER JOIN Socios s ON p.SocioID = s.SocioID
        LEFT JOIN Membresías m ON p.MembresíaID = m.MembresíaID
        LEFT JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
        WHERE p.PagoID = @pagoID;
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 })
    }

    const data = result.recordset[0]

    // ====== Generar PDF ======
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = height - 50
    const fontSizeTitle = 20
    const fontSizeNormal = 10

    const drawText = (
      text: string,
      options: {
        x?: number
        y?: number
        size?: number
        bold?: boolean
        color?: { r: number; g: number; b: number }
      } = {},
    ) => {
      const { x = 50, y: yPos, size = fontSizeNormal, bold = false, color = { r: 0, g: 0, b: 0 } } = options

      page.drawText(text, {
        x,
        y: yPos ?? y,
        size,
        font: bold ? fontBold : font,
        color: rgb(color.r, color.g, color.b),
      })
    }

    drawText("MUNDO FITNESS", { x: 50, y, size: fontSizeTitle, bold: true })
    y -= 18
    drawText("Chimbarongo, Región de O'Higgins", { x: 50, y })
    y -= 12
    drawText("RUT: 76.XXX.XXX-X", { x: 50, y })

    const rightX = width - 250
    let yRight = height - 50
    drawText("RECIBO DE PAGO", { x: rightX, y: yRight, size: 14, bold: true })
    yRight -= 14
    drawText(data.NumeroComprobante || `REF-${data.PagoID}`, { x: rightX, y: yRight, size: 10 })
    yRight -= 12
    drawText(new Date(data.FechaPago).toLocaleString("es-CL"), { x: rightX, y: yRight, size: 10 })

    y -= 40
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
    y -= 30

    drawText("Cliente", { x: 50, y, size: 12, bold: true })
    y -= 16
    drawText(`Nombre: ${data.Nombre} ${data.Apellido}`, { x: 50, y })
    y -= 12
    drawText(`RUT: ${data.RUT}`, { x: 50, y })
    y -= 12
    drawText(`ID Pago: #${data.PagoID}`, { x: 50, y })

    y -= 24
    drawText("Resumen de pago", { x: 50, y, size: 12, bold: true })
    y -= 16
    drawText(`Método: ${data.MetodoPago}`, { x: 50, y })
    y -= 12
    drawText("Estado: Pagado", { x: 50, y })

    y -= 24
    drawText("Detalle", { x: 50, y, size: 12, bold: true })
    y -= 16
    drawText(`Concepto: ${data.Concepto || "Pago de servicios de gimnasio"}`, { x: 50, y, size: 10 })

    y -= 24
    const totalCLP = Number(data.Monto || 0).toLocaleString("es-CL", { style: "currency", currency: "CLP" })
    drawText(`Total Pagado: ${totalCLP}`, { x: 50, y, size: 14, bold: true })

    y -= 40
    drawText("Documento generado electrónicamente.", { x: 50, y, size: 8 })

    const pdfBytes = await pdfDoc.save()

    // ====== S3 (best-effort) ======
    let pdfUrl: string | null = null
    let uploadOk = true

    const tipo: "planes" | "productos" =
      (data.Concepto || "").toLowerCase().includes("producto") ? "productos" : "planes"

    try {
      const up = await uploadComprobantePDF(tipo, pagoID, pdfBytes)
      pdfUrl = up.url

      await pool
        .request()
        .input("url", pdfUrl)
        .input("pagoID", pagoID)
        .query(`
          UPDATE Pagos
          SET ComprobantePath = @url
          WHERE PagoID = @pagoID;
        `)

      // (opcional) tu INSERT a Comprobantes aquí también, si quieres que solo ocurra cuando S3 ok
      // o puedes mantenerlo fuera si quieres insertarlo siempre.
    } catch (e) {
      uploadOk = false
      console.error("⚠️ PDF generado pero NO se pudo subir a S3:", e)
      // opcional: marcar estado/pendiente en DB, o solo dejar ComprobantePath null
    }

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comprobante-${data.PagoID}.pdf"`,
        ...(pdfUrl ? { "x-comprobante-url": pdfUrl } : {}),
        "x-s3-upload": uploadOk ? "ok" : "failed",
      },
    })
  } catch (err) {
    console.error("Error al generar PDF:", err)
    return NextResponse.json({ error: "Error interno al generar PDF" }, { status: 500 })
  }
}