import sql from "mssql"
import { type NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "",
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tipoReporte = body.tipoReporte || "Semanal"
    const formato = body.formato || "json" // Agregando soporte para formato pdf o json

    // Calcular periodo según tipo de reporte
    const fechaFin = new Date()
    const fechaInicio = new Date()

    if (tipoReporte === "Semanal") {
      fechaInicio.setDate(fechaFin.getDate() - 7)
    } else if (tipoReporte === "Mensual") {
      fechaInicio.setMonth(fechaFin.getMonth() - 1)
    } else if (tipoReporte === "Anual") {
      fechaInicio.setFullYear(fechaFin.getFullYear() - 1)
    }

    const pool = await sql.connect(config)

    // Obtener estadísticas actuales
    const stats = await pool.request().query(`
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

    // Obtener costo de mantenimiento del periodo
    const costos = await pool
      .request()
      .input("FechaInicio", sql.Date, fechaInicio)
      .input("FechaFin", sql.Date, fechaFin)
      .query(`
        SELECT ISNULL(SUM(Costo), 0) as CostoTotal
        FROM HistorialMantenimiento
        WHERE FechaMantenimiento BETWEEN @FechaInicio AND @FechaFin
      `)

    // Obtener datos históricos para gráfico (últimos 6 puntos de datos)
    let intervalo = 1 // días
    let puntos = 7
    if (tipoReporte === "Mensual") {
      intervalo = 5
      puntos = 6
    } else if (tipoReporte === "Anual") {
      intervalo = 60
      puntos = 6
    }

    const historico = []
    for (let i = puntos - 1; i >= 0; i--) {
      const fecha = new Date(fechaFin)
      fecha.setDate(fecha.getDate() - i * intervalo)

      const snapshot = await pool
        .request()
        .input("Fecha", sql.Date, fecha)
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
        Operativos: snapshot.recordset[0].Operativos || 0,
        EnMantencion: snapshot.recordset[0].EnMantencion || 0,
        Dañados: snapshot.recordset[0].Dañados || 0,
      })
    }

    const estadisticas = stats.recordset[0]
    const costoMantenimiento = costos.recordset[0].CostoTotal

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

    if (formato === "pdf") {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595, 842]) // A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const { width, height } = page.getSize()

      let yPosition = height - 50

      // Título
      page.drawText("Reporte de Implementos del Gimnasio", {
        x: 50,
        y: yPosition,
        size: 20,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      })
      yPosition -= 30

      // Tipo y Periodo
      page.drawText(`Tipo: ${tipoReporte}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      })
      yPosition -= 20

      page.drawText(`Periodo: ${fechaInicio.toLocaleDateString("es-CL")} - ${fechaFin.toLocaleDateString("es-CL")}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      })
      yPosition -= 40

      // Estadísticas
      page.drawText("Estadísticas Generales", {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      })
      yPosition -= 25

      const stats = [
        [`Total de Implementos:`, `${reporte.TotalImplementos}`],
        [
          `Operativos:`,
          `${reporte.Operativos} (${((reporte.Operativos / reporte.TotalImplementos) * 100).toFixed(1)}%)`,
        ],
        [`En Mantenimiento:`, `${reporte.EnMantencion}`],
        [`Dañados:`, `${reporte.Dañados}`],
        [`Fuera de Servicio:`, `${reporte.FueraDeServicio}`],
        [`Revisiones Pendientes:`, `${reporte.RevisionesPendientes}`],
        [`Costo Total Mantenimiento:`, `$${reporte.CostoMantenimiento.toLocaleString("es-CL")}`],
      ]

      for (const [label, value] of stats) {
        page.drawText(label, {
          x: 70,
          y: yPosition,
          size: 11,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        })
        page.drawText(value, {
          x: 280,
          y: yPosition,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        })
        yPosition -= 20
      }

      yPosition -= 20

      // Datos Históricos
      if (reporte.Historico && reporte.Historico.length > 0) {
        page.drawText("Tendencia Histórica", {
          x: 50,
          y: yPosition,
          size: 16,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.1),
        })
        yPosition -= 25

        page.drawText("Fecha", {
          x: 70,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        })
        page.drawText("Operativos", {
          x: 180,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        })
        page.drawText("En Mant.", {
          x: 280,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        })
        page.drawText("Dañados", {
          x: 360,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        })
        yPosition -= 20

        for (const punto of reporte.Historico) {
          if (yPosition < 50) break // Evitar salir del margen

          page.drawText(punto.fecha, {
            x: 70,
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          })
          page.drawText(punto.Operativos.toString(), {
            x: 200,
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0, 0.6, 0),
          })
          page.drawText(punto.EnMantencion.toString(), {
            x: 295,
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0.8, 0.6, 0),
          })
          page.drawText(punto.Dañados.toString(), {
            x: 375,
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0.8, 0, 0),
          })
          yPosition -= 18
        }
      }

      // Footer
      page.drawText(
        `Generado el ${new Date().toLocaleDateString("es-CL")} a las ${new Date().toLocaleTimeString("es-CL")}`,
        {
          x: 50,
          y: 30,
          size: 9,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        },
      )

      const pdfBytes = await pdfDoc.save()

      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="reporte-implementos-${tipoReporte}-${new Date().toISOString().split("T")[0]}.pdf"`,
        },
      })
    }

    return NextResponse.json({ success: true, reporte })
  } catch (error) {
    console.error("Error al generar reporte:", error)
    return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 })
  }
}