// app/api/admin/implementos/reportes/generar/route.ts
import sql from "mssql"
import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "",
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
}

declare global {
  // eslint-disable-next-line no-var
  var __mssqlPool: sql.ConnectionPool | undefined
}

async function getPool() {
  if (!global.__mssqlPool) global.__mssqlPool = await sql.connect(config)
  return global.__mssqlPool
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tipoReporte = body.tipoReporte || "Semanal"
    const formato = body.formato || "json" // "pdf" o "json"

    const fechaFin = new Date()
    const fechaInicio = new Date()

    if (tipoReporte === "Semanal") fechaInicio.setDate(fechaFin.getDate() - 7)
    else if (tipoReporte === "Mensual") fechaInicio.setMonth(fechaFin.getMonth() - 1)
    else if (tipoReporte === "Anual") fechaInicio.setFullYear(fechaFin.getFullYear() - 1)

    const pool = await getPool()

    const statsRes = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalImplementos,
        SUM(CASE WHEN Estado = 'Operativo' THEN 1 ELSE 0 END) as Operativos,
        SUM(CASE WHEN Estado = 'EnMantencion' THEN 1 ELSE 0 END) as EnMantencion,
        SUM(CASE WHEN Estado = 'Dañado' THEN 1 ELSE 0 END) as Dañados,
        SUM(CASE WHEN Estado = 'FueraDeServicio' THEN 1 ELSE 0 END) as FueraDeServicio,
        SUM(CASE WHEN ProximaRevision < GETDATE() AND ProximaRevision IS NOT NULL THEN 1 ELSE 0 END) as RevisionesPendientes
      FROM Implementos
      WHERE Activo = 1
    `)

    const costosRes = await pool
      .request()
      .input("FechaInicio", sql.DateTime, fechaInicio)
      .input("FechaFin", sql.DateTime, fechaFin)
      .query(`
        SELECT ISNULL(SUM(Costo), 0) as CostoTotal
        FROM HistorialMantenimiento
        WHERE FechaMantenimiento BETWEEN @FechaInicio AND @FechaFin
      `)

    let intervalo = 1
    let puntos = 7
    if (tipoReporte === "Mensual") {
      intervalo = 5
      puntos = 6
    } else if (tipoReporte === "Anual") {
      intervalo = 60
      puntos = 6
    }

    const historico: Array<{ fecha: string; Operativos: number; EnMantencion: number; Dañados: number }> = []

    for (let i = puntos - 1; i >= 0; i--) {
      const fecha = new Date(fechaFin)
      fecha.setDate(fecha.getDate() - i * intervalo)

      const snapRes = await pool
        .request()
        .input("Fecha", sql.DateTime, fecha)
        .query(`
          SELECT 
            SUM(CASE WHEN Estado = 'Operativo' THEN 1 ELSE 0 END) as Operativos,
            SUM(CASE WHEN Estado = 'EnMantencion' THEN 1 ELSE 0 END) as EnMantencion,
            SUM(CASE WHEN Estado = 'Dañado' THEN 1 ELSE 0 END) as Dañados
          FROM Implementos
          WHERE Activo = 1 AND FechaCreacion <= @Fecha
        `)

      historico.push({
        fecha: fecha.toLocaleDateString("es-CL", { month: "short", day: "numeric" }),
        Operativos: snapRes.recordset[0]?.Operativos || 0,
        EnMantencion: snapRes.recordset[0]?.EnMantencion || 0,
        Dañados: snapRes.recordset[0]?.Dañados || 0,
      })
    }

    const estadisticas = statsRes.recordset[0]
    const costoMantenimiento = costosRes.recordset[0]?.CostoTotal ?? 0

    const reporte = {
      TotalImplementos: estadisticas.TotalImplementos,
      Operativos: estadisticas.Operativos,
      EnMantencion: estadisticas.EnMantencion,
      Dañados: estadisticas.Dañados,
      FueraDeServicio: estadisticas.FueraDeServicio,
      RevisionesPendientes: estadisticas.RevisionesPendientes,
      CostoMantenimiento: costoMantenimiento,
      PeriodoInicio: fechaInicio.toISOString(),
      PeriodoFin: fechaFin.toISOString(),
      Historico: historico,
    }

    if (formato !== "pdf") {
      return NextResponse.json({ success: true, reporte })
    }

    // ===== PDF =====
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const { width, height } = page.getSize()

    let y = height - 50

    page.drawText("Reporte de Implementos del Gimnasio", { x: 50, y, size: 20, font: boldFont, color: rgb(0.1, 0.1, 0.1) })
    y -= 30

    page.drawText(`Tipo: ${tipoReporte}`, { x: 50, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) })
    y -= 18

    page.drawText(`Periodo: ${fechaInicio.toLocaleDateString("es-CL")} - ${fechaFin.toLocaleDateString("es-CL")}`, {
      x: 50, y, size: 12, font, color: rgb(0.3, 0.3, 0.3),
    })
    y -= 35

    page.drawText("Estadísticas Generales", { x: 50, y, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) })
    y -= 22

    const total = Math.max(1, Number(reporte.TotalImplementos || 0))

    const rows = [
      ["Total de Implementos:", String(reporte.TotalImplementos)],
      ["Operativos:", `${reporte.Operativos} (${((reporte.Operativos / total) * 100).toFixed(1)}%)`],
      ["En Mantenimiento:", String(reporte.EnMantencion)],
      ["Dañados:", String(reporte.Dañados)],
      ["Fuera de Servicio:", String(reporte.FueraDeServicio)],
      ["Revisiones Pendientes:", String(reporte.RevisionesPendientes)],
      ["Costo Total Mantenimiento:", `$${Number(reporte.CostoMantenimiento).toLocaleString("es-CL")}`],
    ]

    for (const [label, value] of rows) {
      page.drawText(label, { x: 70, y, size: 11, font, color: rgb(0.2, 0.2, 0.2) })
      page.drawText(value, { x: 280, y, size: 11, font: boldFont, color: rgb(0, 0, 0) })
      y -= 18
    }

    y -= 18
    if (reporte.Historico?.length) {
      page.drawText("Tendencia Histórica", { x: 50, y, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) })
      y -= 22

      page.drawText("Fecha", { x: 70, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
      page.drawText("Operativos", { x: 180, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
      page.drawText("En Mant.", { x: 280, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
      page.drawText("Dañados", { x: 360, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
      y -= 18

      for (const p of reporte.Historico) {
        if (y < 60) break
        page.drawText(p.fecha, { x: 70, y, size: 10, font, color: rgb(0.3, 0.3, 0.3) })
        page.drawText(String(p.Operativos), { x: 200, y, size: 10, font, color: rgb(0, 0.4, 0) })
        page.drawText(String(p.EnMantencion), { x: 305, y, size: 10, font, color: rgb(0.6, 0.45, 0) })
        page.drawText(String(p.Dañados), { x: 375, y, size: 10, font, color: rgb(0.6, 0, 0) })
        y -= 16
      }
    }

    page.drawText(
      `Generado el ${new Date().toLocaleDateString("es-CL")} a las ${new Date().toLocaleTimeString("es-CL")}`,
      { x: 50, y: 30, size: 9, font, color: rgb(0.5, 0.5, 0.5) },
    )

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-implementos-${tipoReporte}-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error al generar reporte:", error)
    return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 })
  }
}