import { NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { uploadComprobantePDF } from "@/lib/s3"

export const runtime = "nodejs"

const formatMoney = (m: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(m || 0))

function safeInt(v: any, fallback = 0) {
  const n = Number.parseInt(String(v ?? ""), 10)
  return Number.isFinite(n) ? n : fallback
}

function safeNumber(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "id (VentaID) es requerido" }, { status: 400 })

    const ventaID = safeInt(id, NaN as any)
    if (!Number.isFinite(ventaID)) return NextResponse.json({ error: "id inválido" }, { status: 400 })

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("VentaID", ventaID)
      .query(`
        SELECT 
          V.VentaID,
          V.SocioID,
          V.NumeroComprobante,
          V.FechaVenta,
          V.MontoTotal AS Monto,
          V.MetodoPago,
          V.TipoVenta,
          V.ComprobantePath,

          ISNULL(S.Nombre, 'Venta') AS Nombre,
          ISNULL(S.Apellido, 'al Público') AS Apellido,
          ISNULL(S.RUT, 'N/A') AS RUT,
          ISNULL(S.Email, 'N/A') AS Email,
          ISNULL(S.Telefono, 'N/A') AS Telefono,

          D.Cantidad,
          D.PrecioUnitario,
          D.Subtotal,
          P.NombreProducto,
          P.UnidadMedida
        FROM Ventas V
        JOIN DetalleVenta D ON V.VentaID = D.VentaID
        JOIN Inventario P ON D.ProductoID = P.ProductoID
        LEFT JOIN Socios S ON V.SocioID = S.SocioID
        WHERE V.VentaID = @VentaID;
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Comprobante de venta no encontrado" }, { status: 404 })
    }

    const cabecera = result.recordset[0]
    const detalles = result.recordset.map((row: any) => ({
      NombreProducto: row.NombreProducto,
      Cantidad: safeInt(row.Cantidad, 0),
      PrecioUnitario: safeNumber(row.PrecioUnitario, 0),
      Subtotal: safeNumber(row.Subtotal, 0),
      UnidadMedida: row.UnidadMedida || "u",
    }))

    // =========================
    //  PDF
    // =========================
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let page = pdfDoc.addPage([595, 842]) // A4
    let { width, height } = page.getSize()
    let y = height - 50

    const drawText = (
      text: string,
      opts: { x?: number; y?: number; size?: number; bold?: boolean; color?: { r: number; g: number; b: number } } = {},
    ) => {
      const x = opts.x ?? 50
      const yy = opts.y ?? y
      const size = opts.size ?? 10
      const bold = opts.bold ?? false
      const color = opts.color ?? { r: 0, g: 0, b: 0 }

      page.drawText(String(text ?? ""), {
        x,
        y: yy,
        size,
        font: bold ? fontBold : font,
        color: rgb(color.r, color.g, color.b),
      })
    }

    const drawTextRight = (text: string, rightX: number, yy: number, size = 10, bold = false, color = { r: 0, g: 0, b: 0 }) => {
      const f = bold ? fontBold : font
      const w = f.widthOfTextAtSize(String(text ?? ""), size)
      page.drawText(String(text ?? ""), {
        x: rightX - w,
        y: yy,
        size,
        font: f,
        color: rgb(color.r, color.g, color.b),
      })
    }

    const newPageIfNeeded = () => {
      if (y >= 60) return
      page = pdfDoc.addPage([595, 842])
      ;({ width, height } = page.getSize())
      y = height - 50
      // header tabla (si queremos repetir)
      drawTableHeader()
      y -= 18
    }

    // Header izquierda
    drawText("MUNDO FITNESS", { x: 50, y, size: 20, bold: true })
    y -= 18
    drawText("Chimbarongo, Región de O'Higgins", { x: 50, y, size: 10, color: { r: 0.3, g: 0.3, b: 0.3 } })
    y -= 12
    drawText("RUT: 76.XXX.XXX-X", { x: 50, y, size: 10, color: { r: 0.3, g: 0.3, b: 0.3 } })

    // Header derecha
    const rightBlockX = width - 50
    let yRight = height - 50
    drawTextRight("COMPROBANTE DE VENTA", rightBlockX, yRight, 14, true, { r: 0.1, g: 0.1, b: 0.1 })
    yRight -= 14

    const numeroComprobanteDisplay = cabecera.NumeroComprobante || `VTA-${ventaID}`
    drawTextRight(numeroComprobanteDisplay, rightBlockX, yRight, 10, false, { r: 0.25, g: 0.25, b: 0.25 })
    yRight -= 12
    drawTextRight(new Date(cabecera.FechaVenta).toLocaleString("es-CL"), rightBlockX, yRight, 10, false, {
      r: 0.25,
      g: 0.25,
      b: 0.25,
    })

    // Línea separadora
    y = Math.min(y, yRight) - 28
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    })
    y -= 25

    // Cliente
    drawText("Cliente", { x: 50, y, size: 12, bold: true })
    y -= 16
    drawText(`Nombre: ${cabecera.Nombre} ${cabecera.Apellido}`, { x: 50, y })
    y -= 12
    drawText(`RUT: ${cabecera.RUT}`, { x: 50, y })
    y -= 12
    drawText(`ID Venta: #${ventaID}`, { x: 50, y })

    // Pago
    y -= 24
    drawText("Resumen de Pago", { x: 50, y, size: 12, bold: true })
    y -= 16
    drawText(`Método: ${cabecera.MetodoPago}`, { x: 50, y })
    y -= 12
    drawText("Estado: Pagado", { x: 50, y })
    y -= 20

    // Tabla
    const colProducto = 50
    const colCant = width - 230
    const colPrecio = width - 150
    const colTotal = width - 50

    const drawTableHeader = () => {
      page.drawRectangle({
        x: 50,
        y: y - 10,
        width: width - 100,
        height: 16,
        color: rgb(0.95, 0.95, 0.95),
      })
      drawText("PRODUCTO", { x: colProducto, y, size: 8, bold: true, color: { r: 0.3, g: 0.3, b: 0.3 } })
      drawTextRight("CANT.", colCant + 40, y, 8, true, { r: 0.3, g: 0.3, b: 0.3 })
      drawTextRight("PRECIO UNIT.", colPrecio + 60, y, 8, true, { r: 0.3, g: 0.3, b: 0.3 })
      drawTextRight("TOTAL", colTotal, y, 8, true, { r: 0.3, g: 0.3, b: 0.3 })
    }

    drawText("Detalle de Productos", { x: 50, y, size: 12, bold: true })
    y -= 16
    drawTableHeader()
    y -= 18

    for (const item of detalles) {
      newPageIfNeeded()

      // producto (corta si es largo)
      const nombre = String(item.NombreProducto ?? "")
      const nombreMax = 45
      const nombrePrint = nombre.length > nombreMax ? nombre.slice(0, nombreMax - 1) + "…" : nombre

      drawText(nombrePrint, { x: colProducto, y, size: 10 })
      drawTextRight(`${item.Cantidad} ${item.UnidadMedida}`, colCant + 40, y, 10, false, { r: 0.1, g: 0.1, b: 0.1 })
      drawTextRight(formatMoney(item.PrecioUnitario), colPrecio + 60, y, 10, false, { r: 0.1, g: 0.1, b: 0.1 })
      drawTextRight(formatMoney(item.Subtotal), colTotal, y, 10, true, { r: 0.1, g: 0.1, b: 0.1 })

      y -= 18
    }

    y -= 10
    page.drawLine({
      start: { x: width - 220, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    })
    y -= 18

    drawText("TOTAL PAGADO:", { x: width - 220, y, size: 14, bold: true })
    drawTextRight(formatMoney(cabecera.Monto), width - 50, y, 14, true, { r: 0.1, g: 0.5, b: 0.1 })
    y -= 40

    drawText("Documento generado electrónicamente. Gracias por su compra en Mundo Fitness.", {
      x: 50,
      y,
      size: 8,
      color: { r: 0.5, g: 0.5, b: 0.5 },
    })

    const pdfBytes = await pdfDoc.save()

    // =========================
    // S3 + BD (NO BLOQUEA DESCARGA)
    // =========================
    let pdfUrl: string | null = null

    try {
      const tipo: "planes" | "productos" = "productos"
      const uploaded = await uploadComprobantePDF(tipo, ventaID, pdfBytes)
      pdfUrl = uploaded.url

      // actualizar Ventas
      await pool
        .request()
        .input("url", pdfUrl)
        .input("VentaID", ventaID)
        .query(`
          UPDATE Ventas
          SET ComprobantePath = @url
          WHERE VentaID = @VentaID;
        `)

      // Insertar/Upsert Comprobantes
      const numeroComprobante = cabecera.NumeroComprobante ?? `VTA-${ventaID}`
      const nombreCliente = `${cabecera.Nombre} ${cabecera.Apellido}`.trim()

      await pool
        .request()
        .input("VentaID", ventaID)
        .input("SocioID", cabecera.SocioID ?? null)
        .input("PagoID", null)
        // ✅ SIN ACENTO:
        .input("MembresiaID", null)
        .input("NombrePlan", null)
        .input("DuracionPlan", null)
        .input("FechaInicio", null)
        .input("FechaVencimiento", null)
        .input("NumeroComprobante", numeroComprobante)
        .input("MontoPago", cabecera.Monto)
        .input("MedioPago", cabecera.MetodoPago)
        .input("NombreSocio", nombreCliente)
        .input("EmailSocio", cabecera.Email === "N/A" ? null : cabecera.Email)
        .input("TelefonoSocio", cabecera.Telefono === "N/A" ? null : cabecera.Telefono)
        .input("Concepto", "Venta de Productos")
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Comprobantes WHERE VentaID = @VentaID)
          BEGIN
            INSERT INTO Comprobantes (
              VentaID,
              PagoID,
              SocioID,
              MembresiaID,
              NumeroComprobante,
              FechaEmision,
              MontoPago,
              MedioPago,
              NombreSocio,
              EmailSocio,
              TelefonoSocio,
              NombrePlan,
              DuracionPlan,
              FechaInicio,
              FechaVencimiento,
              Concepto,
              Estado,
              FechaCreacion
            )
            VALUES (
              @VentaID,
              @PagoID,
              @SocioID,
              @MembresiaID,
              @NumeroComprobante,
              GETDATE(),
              @MontoPago,
              @MedioPago,
              @NombreSocio,
              @EmailSocio,
              @TelefonoSocio,
              @NombrePlan,
              @DuracionPlan,
              @FechaInicio,
              @FechaVencimiento,
              @Concepto,
              'Emitido',
              GETDATE()
            )
          END
        `)
    } catch (s3Err) {
      // ✅ Importantísimo: NO cortamos el response del PDF
      console.error("⚠️ Falló S3/BD (pero se devolverá el PDF igual):", s3Err)
      pdfUrl = null
    }

    // ✅ Siempre devolvemos el PDF
    const res = new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comprobante-venta-${ventaID}.pdf"`,
        // útil para debug en navegador:
        "Cache-Control": "no-store",
      },
    })

    if (pdfUrl) res.headers.set("x-comprobante-url", pdfUrl)

    return res
  } catch (err) {
    console.error("================================================")
    console.error("Error al generar PDF de Venta:", err)
    console.error("================================================")
    return NextResponse.json(
      { error: "Error interno al generar PDF de Venta. Consulte el log del servidor." },
      { status: 500 },
    )
  }
}