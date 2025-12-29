import { getConnection } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { readFileSync } from "fs"
import { NextResponse } from "next/server"
import { join } from "path"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoReporte = searchParams.get("tipo") || "general"
    const fechaDesde = searchParams.get("desde") || ""
    const fechaHasta = searchParams.get("hasta") || ""

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 })
    }

    const pool = await getConnection()

    let whereClause = ""
    if (fechaDesde && fechaHasta) {
      whereClause = `WHERE FechaPago BETWEEN '${fechaDesde}' AND '${fechaHasta}'`
    }

    const pdfDoc = await PDFDocument.create()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()

    try {
      const logoPath = join(process.cwd(), "public", "images", "logoMundo.png")
      const logoBytes = readFileSync(logoPath)
      const logoImage = await pdfDoc.embedPng(logoBytes)
      const logoDims = logoImage.scale(0.03)
      page.drawImage(logoImage, {
        x: width - logoDims.width - 40,
        y: height - logoDims.height - 40,
        width: logoDims.width,
        height: logoDims.height,
      })
    } catch (error) {
      console.error("[v0] Error loading logo:", error)
    }

    let reportTitle = ""

    switch (tipoReporte) {
      case "ingresos":
        reportTitle = "INFORME DE INGRESOS Y FACTURACIÓN"
        break
      case "asistencia":
        reportTitle = "INFORME DE ASISTENCIA A CLASES"
        break
      case "socios":
        reportTitle = "INFORME DE ESTADO DE SOCIOS"
        break
      case "financiero":
        reportTitle = "INFORME FINANCIERO Y BALANCE"
        break
      case "uso":
        reportTitle = "INFORME DE USO DE INSTALACIONES"
        break
      default:
        reportTitle = "INFORME GENERAL"
    }

    let yPosition = height - 70

    page.drawText(reportTitle, {
      x: 50,
      y: yPosition,
      size: 15,
      font: helveticaBoldFont,
      color: rgb(0.15, 0.15, 0.15),
    })

    yPosition -= 25
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPosition -= 20
    page.drawText(
      `Período: ${format(new Date(fechaDesde), "dd/MM/yyyy")} - ${format(new Date(fechaHasta), "dd/MM/yyyy")}`,
      {
        x: 50,
        y: yPosition,
        size: 9,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      },
    )

    yPosition -= 15
    page.drawText(`Fecha de Generación: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, {
      x: 50,
      y: yPosition,
      size: 8,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    yPosition -= 35

    const checkAndAddPage = (neededSpace: number) => {
      if (yPosition - neededSpace < 80) {
        page = pdfDoc.addPage([595, 842])
        yPosition = height - 60
        return true
      }
      return false
    }

    switch (tipoReporte) {
      case "ingresos":
        const resumenIngresos = await pool.request().query(`
          SELECT 
            MedioPago,
            COUNT(*) as cantidad,
            SUM(MontoPago) as total,
            AVG(MontoPago) as promedio
          FROM Pagos
          ${whereClause}
          GROUP BY MedioPago
        `)

        const totalGeneral = resumenIngresos.recordset.reduce((sum, r) => sum + r.total, 0)

        page.drawText("RESUMEN EJECUTIVO", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 20

        page.drawRectangle({
          x: 50,
          y: yPosition - 25,
          width: 495,
          height: 35,
          color: rgb(0.96, 0.96, 0.96),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        })

        page.drawText(`Total de Ingresos: $${totalGeneral.toLocaleString()}`, {
          x: 60,
          y: yPosition - 10,
          size: 10,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        page.drawText(`Número de Transacciones: ${resumenIngresos.recordset.reduce((sum, r) => sum + r.cantidad, 0)}`, {
          x: 60,
          y: yPosition - 23,
          size: 8,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        })

        yPosition -= 45

        page.drawText("DETALLE POR MÉTODO DE PAGO", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 25

        page.drawRectangle({
          x: 50,
          y: yPosition - 3,
          width: 495,
          height: 16,
          color: rgb(0.25, 0.25, 0.25),
        })

        page.drawText("Método", { x: 60, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Trans.", { x: 230, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Promedio", { x: 310, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Total", { x: 420, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("%", { x: 495, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })

        yPosition -= 16

        for (const item of resumenIngresos.recordset) {
          checkAndAddPage(14)
          const porcentaje = ((item.total / totalGeneral) * 100).toFixed(1)

          page.drawRectangle({
            x: 50,
            y: yPosition - 3,
            width: 495,
            height: 14,
            color: rgb(0.98, 0.98, 0.98),
          })

          page.drawText(item.MedioPago, {
            x: 60,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.cantidad.toString(), {
            x: 240,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(`$${item.promedio.toFixed(2)}`, {
            x: 310,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(`$${item.total.toLocaleString()}`, {
            x: 410,
            y: yPosition,
            size: 8,
            font: helveticaBoldFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(`${porcentaje}%`, {
            x: 495,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })

          const barWidth = (item.total / totalGeneral) * 100
          page.drawRectangle({
            x: 170,
            y: yPosition - 2,
            width: barWidth * 0.5,
            height: 7,
            color: rgb(0.3, 0.5, 0.8),
          })

          yPosition -= 14
        }
        break

      case "asistencia":
        const asistenciaClases = await pool.request().query(`
          SELECT TOP 15
            c.NombreClase,
            COUNT(*) as totalReservas,
            COUNT(CASE WHEN rc.Estado = 'Asistió' THEN 1 END) as asistieron,
            COUNT(CASE WHEN rc.Estado = 'No Asistió' THEN 1 END) as noAsistieron,
            CAST(COUNT(CASE WHEN rc.Estado = 'Asistió' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) as porcentajeAsistencia
          FROM ReservasClases rc
          INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
          ${whereClause.replace("FechaPago", "rc.FechaClase")}
          GROUP BY c.NombreClase
          ORDER BY totalReservas DESC
        `)

        page.drawText("RESUMEN DE ASISTENCIA", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 20

        const totalReservas = asistenciaClases.recordset.reduce((sum, r) => sum + r.totalReservas, 0)
        const totalAsistieron = asistenciaClases.recordset.reduce((sum, r) => sum + r.asistieron, 0)
        const tasaAsistenciaGlobal = ((totalAsistieron / totalReservas) * 100).toFixed(1)

        page.drawRectangle({
          x: 50,
          y: yPosition - 25,
          width: 495,
          height: 35,
          color: rgb(0.96, 0.96, 0.96),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        })

        page.drawText(`Tasa de Asistencia Global: ${tasaAsistenciaGlobal}%`, {
          x: 60,
          y: yPosition - 10,
          size: 10,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        page.drawText(`Total de Reservas: ${totalReservas} | Asistencias: ${totalAsistieron}`, {
          x: 60,
          y: yPosition - 23,
          size: 8,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        })

        yPosition -= 45

        page.drawText("TOP 15 CLASES CON MAYOR DEMANDA", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 25

        page.drawRectangle({
          x: 50,
          y: yPosition - 3,
          width: 495,
          height: 16,
          color: rgb(0.25, 0.25, 0.25),
        })

        page.drawText("Clase", { x: 60, y: yPosition, size: 8, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Reservas", { x: 280, y: yPosition, size: 8, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Asist.", { x: 360, y: yPosition, size: 8, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("No Asist.", { x: 420, y: yPosition, size: 8, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("% Asist.", { x: 485, y: yPosition, size: 8, font: helveticaBoldFont, color: rgb(1, 1, 1) })

        yPosition -= 16

        for (const item of asistenciaClases.recordset) {
          checkAndAddPage(14)

          page.drawRectangle({
            x: 50,
            y: yPosition - 3,
            width: 495,
            height: 14,
            color: rgb(0.98, 0.98, 0.98),
          })

          page.drawText(item.NombreClase.substring(0, 30), {
            x: 60,
            y: yPosition,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.totalReservas.toString(), {
            x: 295,
            y: yPosition,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.asistieron.toString(), {
            x: 370,
            y: yPosition,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.noAsistieron.toString(), {
            x: 435,
            y: yPosition,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(`${item.porcentajeAsistencia}%`, {
            x: 485,
            y: yPosition,
            size: 7,
            font: helveticaBoldFont,
            color: rgb(0.2, 0.2, 0.2),
          })

          yPosition -= 14
        }
        break

      case "financiero":
        const ingresosTotales = await pool.request().query(`
          SELECT 
            SUM(MontoPago) as totalIngresos,
            COUNT(*) as numeroPagos,
            AVG(MontoPago) as promedioIngreso
          FROM Pagos
          ${whereClause}
        `)

        const ingresosPorCategoria = await pool.request().query(`
          SELECT 
            CASE 
              WHEN Concepto LIKE '%Membresía%' THEN 'Membresías'
              WHEN Concepto LIKE '%Sesión%' THEN 'Sesiones Personales'
              ELSE 'Otros Servicios'
            END as categoria,
            SUM(MontoPago) as total,
            COUNT(*) as cantidad
          FROM Pagos
          ${whereClause}
          GROUP BY CASE 
            WHEN Concepto LIKE '%Membresía%' THEN 'Membresías'
            WHEN Concepto LIKE '%Sesión%' THEN 'Sesiones Personales'
            ELSE 'Otros Servicios'
          END
        `)

        page.drawText("BALANCE FINANCIERO", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 20

        const totalIngr = ingresosTotales.recordset[0]

        page.drawRectangle({
          x: 50,
          y: yPosition - 35,
          width: 495,
          height: 45,
          color: rgb(0.96, 0.96, 0.96),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        })

        page.drawText(`Total de Ingresos: $${totalIngr.totalIngresos.toLocaleString()}`, {
          x: 60,
          y: yPosition - 10,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        page.drawText(`Número de Transacciones: ${totalIngr.numeroPagos}`, {
          x: 60,
          y: yPosition - 23,
          size: 8,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        })

        page.drawText(`Ticket Promedio: $${totalIngr.promedioIngreso.toFixed(2)}`, {
          x: 60,
          y: yPosition - 35,
          size: 8,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        })

        yPosition -= 55

        page.drawText("DISTRIBUCIÓN POR CATEGORÍA", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 25

        page.drawRectangle({
          x: 50,
          y: yPosition - 3,
          width: 495,
          height: 16,
          color: rgb(0.25, 0.25, 0.25),
        })

        page.drawText("Categoría", { x: 60, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Trans.", { x: 280, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Total", { x: 380, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("% Part.", { x: 480, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })

        yPosition -= 16

        for (const item of ingresosPorCategoria.recordset) {
          const porcentaje = ((item.total / totalIngr.totalIngresos) * 100).toFixed(1)

          page.drawRectangle({
            x: 50,
            y: yPosition - 3,
            width: 495,
            height: 14,
            color: rgb(0.98, 0.98, 0.98),
          })

          page.drawText(item.categoria, {
            x: 60,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.cantidad.toString(), {
            x: 290,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(`$${item.total.toLocaleString()}`, {
            x: 370,
            y: yPosition,
            size: 8,
            font: helveticaBoldFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(`${porcentaje}%`, {
            x: 485,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })

          const barWidth = (item.total / totalIngr.totalIngresos) * 120
          page.drawRectangle({
            x: 240,
            y: yPosition - 2,
            width: barWidth,
            height: 7,
            color: rgb(0.3, 0.5, 0.8),
          })

          yPosition -= 14
        }
        break

      case "socios":
        const resumenSocios = await pool.request().query(`
          SELECT 
            EstadoSocio,
            COUNT(*) as cantidad
          FROM Socios
          GROUP BY EstadoSocio
        `)

        page.drawText("RESUMEN GENERAL", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 25

        page.drawRectangle({
          x: 50,
          y: yPosition - 3,
          width: 495,
          height: 16,
          color: rgb(0.25, 0.25, 0.25),
        })

        page.drawText("Estado", { x: 60, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Cantidad", { x: 380, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("% Total", { x: 480, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })

        yPosition -= 16

        const totalSoc = resumenSocios.recordset.reduce((sum, r) => sum + r.cantidad, 0)

        for (const item of resumenSocios.recordset) {
          const porcentaje = ((item.cantidad / totalSoc) * 100).toFixed(1)

          page.drawRectangle({
            x: 50,
            y: yPosition - 3,
            width: 495,
            height: 14,
            color: rgb(0.98, 0.98, 0.98),
          })

          page.drawText(item.EstadoSocio, {
            x: 60,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.cantidad.toString(), {
            x: 395,
            y: yPosition,
            size: 8,
            font: helveticaBoldFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(`${porcentaje}%`, {
            x: 490,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })

          const barWidth = (item.cantidad / totalSoc) * 100
          page.drawRectangle({
            x: 250,
            y: yPosition - 2,
            width: barWidth,
            height: 7,
            color: rgb(0.3, 0.5, 0.8),
          })

          yPosition -= 14
        }

        yPosition -= 25

        const sociosDetalle = await pool.request().query(`
          SELECT TOP 20
            s.Nombre + ' ' + s.Apellido as nombreCompleto,
            s.Email,
            s.EstadoSocio,
            pm.NombrePlan,
            m.FechaVencimiento
          FROM Socios s
          LEFT JOIN Membresías m ON s.SocioID = m.SocioID AND m.Estado = 'Vigente'
          LEFT JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
          ORDER BY s.FechaRegistro DESC
        `)

        checkAndAddPage(60)
        page.drawText("ÚLTIMOS 20 REGISTROS", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 25

        page.drawRectangle({
          x: 50,
          y: yPosition - 3,
          width: 495,
          height: 16,
          color: rgb(0.25, 0.25, 0.25),
        })

        page.drawText("Nombre", { x: 60, y: yPosition, size: 8, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Estado", { x: 220, y: yPosition, size: 8, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Plan", { x: 310, y: yPosition, size: 8, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Vencimiento", { x: 445, y: yPosition, size: 8, font: helveticaBoldFont, color: rgb(1, 1, 1) })

        yPosition -= 16

        for (const item of sociosDetalle.recordset) {
          checkAndAddPage(14)

          page.drawRectangle({
            x: 50,
            y: yPosition - 3,
            width: 495,
            height: 14,
            color: rgb(0.98, 0.98, 0.98),
          })

          page.drawText(item.nombreCompleto.substring(0, 22), {
            x: 60,
            y: yPosition,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.EstadoSocio, {
            x: 220,
            y: yPosition,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.NombrePlan ? item.NombrePlan.substring(0, 18) : "Sin plan", {
            x: 310,
            y: yPosition,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.FechaVencimiento ? format(new Date(item.FechaVencimiento), "dd/MM/yy") : "N/A", {
            x: 455,
            y: yPosition,
            size: 7,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          yPosition -= 14
        }
        break

      case "uso":
        const usoGimnasio = await pool.request().query(`
          SELECT TOP 15
            DATENAME(WEEKDAY, FechaHoraIngreso) as diaSemana,
            DATEPART(HOUR, FechaHoraIngreso) as hora,
            COUNT(*) as totalEntradas
          FROM Asistencias
          ${whereClause.replace("FechaPago", "FechaHoraIngreso")}
          GROUP BY DATENAME(WEEKDAY, FechaHoraIngreso), DATEPART(HOUR, FechaHoraIngreso)
          ORDER BY totalEntradas DESC
        `)

        const resumenUso = await pool.request().query(`
          SELECT 
            COUNT(*) as totalEntradas,
            COUNT(DISTINCT SocioID) as sociosUnicos,
            COUNT(*) / NULLIF(DATEDIFF(DAY, '${fechaDesde}', '${fechaHasta}'), 0) as promedioDiario
          FROM Asistencias
          ${whereClause.replace("FechaPago", "FechaHoraIngreso")}
        `)

        page.drawText("RESUMEN DE OCUPACIÓN", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 20

        const usoData = resumenUso.recordset[0]

        page.drawRectangle({
          x: 50,
          y: yPosition - 35,
          width: 495,
          height: 45,
          color: rgb(0.96, 0.96, 0.96),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        })

        page.drawText(`Total de Entradas: ${usoData.totalEntradas}`, {
          x: 60,
          y: yPosition - 10,
          size: 10,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        page.drawText(`Socios Únicos: ${usoData.sociosUnicos}`, {
          x: 60,
          y: yPosition - 23,
          size: 8,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        })

        page.drawText(`Promedio Diario: ${Math.round(usoData.promedioDiario)} entradas`, {
          x: 60,
          y: yPosition - 35,
          size: 8,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        })

        yPosition -= 55

        page.drawText("TOP 15 HORARIOS DE MAYOR AFLUENCIA", {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(0.2, 0.2, 0.2),
        })

        yPosition -= 25

        page.drawRectangle({
          x: 50,
          y: yPosition - 3,
          width: 495,
          height: 16,
          color: rgb(0.25, 0.25, 0.25),
        })

        page.drawText("Día", { x: 60, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Horario", { x: 230, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })
        page.drawText("Entradas", { x: 380, y: yPosition, size: 9, font: helveticaBoldFont, color: rgb(1, 1, 1) })

        yPosition -= 16

        const maxEntradas = Math.max(...usoGimnasio.recordset.map((r) => r.totalEntradas))

        for (const item of usoGimnasio.recordset) {
          checkAndAddPage(14)

          page.drawRectangle({
            x: 50,
            y: yPosition - 3,
            width: 495,
            height: 14,
            color: rgb(0.98, 0.98, 0.98),
          })

          page.drawText(item.diaSemana.substring(0, 15), {
            x: 60,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(`${item.hora}:00`, {
            x: 240,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          })
          page.drawText(item.totalEntradas.toString(), {
            x: 395,
            y: yPosition,
            size: 8,
            font: helveticaBoldFont,
            color: rgb(0.2, 0.2, 0.2),
          })

          const barWidth = (item.totalEntradas / maxEntradas) * 90
          page.drawRectangle({
            x: 310,
            y: yPosition - 2,
            width: barWidth,
            height: 7,
            color: rgb(0.3, 0.5, 0.8),
          })

          yPosition -= 14
        }
        break

      default:
        page.drawText("Seleccione un tipo de reporte específico.", {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.4),
        })
    }

    const pages = pdfDoc.getPages()
    pages.forEach((pg, index) => {
      pg.drawLine({
        start: { x: 50, y: 50 },
        end: { x: width - 50, y: 50 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      })

      pg.drawText("Gimnasio Mundo Fitness | Documento Confidencial", {
        x: 50,
        y: 35,
        size: 7,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      })

      pg.drawText(`Página ${index + 1} de ${pages.length}`, {
        x: width - 100,
        y: 35,
        size: 7,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      })
    })

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Informe_${tipoReporte}_${format(new Date(), "yyyyMMdd")}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error al generar PDF:", error)
    return NextResponse.json(
      { error: "Error al generar PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}