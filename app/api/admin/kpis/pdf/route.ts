import { getConnection } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { readFileSync } from "fs"
import { NextResponse } from "next/server"
import { join } from "path"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

async function getChartImage(config: any): Promise<Uint8Array> {
  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&width=250&height=180&backgroundColor=white`
  const response = await fetch(chartUrl)
  const arrayBuffer = await response.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

export async function GET(request: Request) {
  try {
    console.log("[v0] Iniciando generación de PDF...")

    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get("periodo") || "mensual"

    const pool = await getConnection()

    const sociosResult = await pool.request().query(`
      SELECT 
        EstadoSocio,
        COUNT(*) as total
      FROM Socios
      GROUP BY EstadoSocio
    `)

    const ingresosTotalesResult = await pool.request().query(`
      SELECT 
        ISNULL(SUM(MontoPago), 0) as totalPagos,
        COUNT(*) as numeroPagos,
        ISNULL(AVG(MontoPago), 0) as promedioIngreso
      FROM Pagos
      WHERE FechaPago >= DATEADD(MONTH, -1, GETDATE())
    `)

    const ingresosPorMembresia = await pool.request().query(`
      SELECT TOP 5
        pm.NombrePlan,
        SUM(p.MontoPago) as totalIngresos
      FROM Pagos p
      INNER JOIN Membresías m ON p.SocioID = m.SocioID
      INNER JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
      WHERE p.FechaPago >= DATEADD(MONTH, -1, GETDATE())
      GROUP BY pm.NombrePlan
      ORDER BY totalIngresos DESC
    `)

    const entradasResult = await pool.request().query(`
      SELECT 
        COUNT(*) as totalEntradas
      FROM Asistencias
      WHERE FechaHoraIngreso >= DATEADD(MONTH, -1, GETDATE())
    `)

    const asistenciaPorDia = await pool.request().query(`
      SELECT TOP 7
        DATENAME(WEEKDAY, FechaHoraIngreso) as dia,
        COUNT(*) as cantidad
      FROM Asistencias
      WHERE FechaHoraIngreso >= DATEADD(DAY, -7, GETDATE())
      GROUP BY DATENAME(WEEKDAY, FechaHoraIngreso), DATEPART(WEEKDAY, FechaHoraIngreso)
      ORDER BY DATEPART(WEEKDAY, FechaHoraIngreso)
    `)

    console.log("[v0] Datos obtenidos, generando gráficos...")

    const sociosData = sociosResult.recordset
    const sociosChartConfig = {
      type: "doughnut",
      data: {
        labels: sociosData.map((s) => s.EstadoSocio),
        datasets: [
          {
            data: sociosData.map((s) => s.total),
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "bottom", labels: { fontSize: 10, padding: 5 } },
          title: { display: true, text: "Distribución de Socios", fontSize: 12 },
        },
      },
    }

    const ingresosData = ingresosPorMembresia.recordset
    const ingresosChartConfig = {
      type: "bar",
      data: {
        labels: ingresosData.map((i) => i.NombrePlan),
        datasets: [
          {
            label: "Ingresos",
            data: ingresosData.map((i) => i.totalIngresos),
            backgroundColor: "#3B82F6",
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Ingresos por Membresía", fontSize: 12 },
        },
        scales: {
          y: { beginAtZero: true, ticks: { fontSize: 9 } },
          x: { ticks: { fontSize: 9 } },
        },
      },
    }

    const asistenciaData = asistenciaPorDia.recordset
    const asistenciaChartConfig = {
      type: "line",
      data: {
        labels: asistenciaData.map((a) => a.dia),
        datasets: [
          {
            label: "Asistencia",
            data: asistenciaData.map((a) => a.cantidad),
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Asistencia Semanal", fontSize: 12 },
        },
        scales: {
          y: { beginAtZero: true, ticks: { fontSize: 9 } },
          x: { ticks: { fontSize: 9 } },
        },
      },
    }

    const [sociosChartBytes, ingresosChartBytes, asistenciaChartBytes] = await Promise.all([
      getChartImage(sociosChartConfig),
      getChartImage(ingresosChartConfig),
      getChartImage(asistenciaChartConfig),
    ])

    console.log("[v0] Gráficos generados, creando documento PDF...")

    const pdfDoc = await PDFDocument.create()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const sociosChart = await pdfDoc.embedPng(sociosChartBytes)
    const ingresosChart = await pdfDoc.embedPng(ingresosChartBytes)
    const asistenciaChart = await pdfDoc.embedPng(asistenciaChartBytes)

    // Función auxiliar para agregar logo y encabezado
    const agregarEncabezado = async (page: any, titulo: string, numeroPagina: number, totalPaginas: number) => {
      const { width, height } = page.getSize()

      // Logo
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
        console.log("[v0] No se pudo cargar el logo")
      }

      let yPosition = height - 70

      // Título principal
      page.drawText("INFORME DE INDICADORES CLAVE", {
        x: 50,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      yPosition -= 18
      page.drawText(`Período: ${periodo.toUpperCase()}`, {
        x: 50,
        y: yPosition,
        size: 9,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4),
      })

      yPosition -= 20
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      })

      yPosition -= 30

      // Subtítulo de sección
      page.drawText(titulo, {
        x: 50,
        y: yPosition,
        size: 13,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      yPosition -= 5
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 250, y: yPosition },
        thickness: 1,
        color: rgb(0.23, 0.51, 0.96),
      })

      // Pie de página
      page.drawLine({
        start: { x: 50, y: 60 },
        end: { x: width - 50, y: 60 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      })

      page.drawText("Gimnasio Mundo Fitness - Informe Confidencial", {
        x: 50,
        y: 45,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      })

      page.drawText(`Página ${numeroPagina} de ${totalPaginas}`, {
        x: width - 100,
        y: 45,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      })

      return yPosition - 20
    }

    const pagePortada = pdfDoc.addPage([595, 842])
    const { width: w1, height: h1 } = pagePortada.getSize()

    try {
      const logoPath = join(process.cwd(), "public", "images", "logoMundo.png")
      const logoBytes = readFileSync(logoPath)
      const logoImage = await pdfDoc.embedPng(logoBytes)
      const logoDims = logoImage.scale(0.05)
      pagePortada.drawImage(logoImage, {
        x: (w1 - logoDims.width) / 2,
        y: h1 - 150,
        width: logoDims.width,
        height: logoDims.height,
      })
    } catch (error) {
      console.log("[v0] No se pudo cargar el logo")
    }

    let yPos = h1 - 250
    pagePortada.drawText("INFORME DE INDICADORES CLAVE", {
      x: 50,
      y: yPos,
      size: 20,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPos -= 40
    pagePortada.drawText(`Período de Análisis: ${periodo.toUpperCase()}`, {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPos -= 25
    pagePortada.drawText(`Fecha de Generación: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    yPos -= 60
    const totalSocios = sociosResult.recordset.reduce((acc, r) => acc + r.total, 0)
    const ingresos = ingresosTotalesResult.recordset[0]
    const entradas = entradasResult.recordset[0]

    pagePortada.drawText("RESUMEN EJECUTIVO", {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPos -= 30
    pagePortada.drawText(`• Total de Socios: ${totalSocios}`, {
      x: 70,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPos -= 25
    pagePortada.drawText(`• Ingresos del Período: $${ingresos.totalPagos.toLocaleString()}`, {
      x: 70,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPos -= 25
    pagePortada.drawText(`• Total de Asistencias: ${entradas.totalEntradas}`, {
      x: 70,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPos -= 25
    pagePortada.drawText(`• Promedio de Ingreso por Pago: $${ingresos.promedioIngreso.toFixed(2)}`, {
      x: 70,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    // Pie de página portada
    pagePortada.drawLine({
      start: { x: 50, y: 60 },
      end: { x: w1 - 50, y: 60 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    })
    pagePortada.drawText("Gimnasio Mundo Fitness - Informe Confidencial", {
      x: 50,
      y: 45,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    })
    pagePortada.drawText("Página 1 de 4", {
      x: w1 - 100,
      y: 45,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    })

    const pageSocios = pdfDoc.addPage([595, 842])
    let yPosition = await agregarEncabezado(pageSocios, "1. ESTADO DE SOCIOS", 2, 4)

    const { width, height } = pageSocios.getSize()
    const chartWidth = 350
    const chartHeight = 260
    const chartX = (width - chartWidth) / 2

    yPosition -= 20
    pageSocios.drawText("Distribución actual de miembros del gimnasio", {
      x: 70,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    yPosition -= 300
    pageSocios.drawImage(sociosChart, {
      x: chartX,
      y: yPosition,
      width: chartWidth,
      height: chartHeight,
    })

    yPosition -= 40

    // Tabla de datos
    pageSocios.drawText("DETALLE POR ESTADO", {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPosition -= 25
    sociosResult.recordset.forEach((item) => {
      const porcentaje = ((item.total / totalSocios) * 100).toFixed(1)

      pageSocios.drawText(`${item.EstadoSocio}:`, {
        x: 90,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      })

      pageSocios.drawText(`${item.total} socios`, {
        x: 250,
        y: yPosition,
        size: 10,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      pageSocios.drawText(`(${porcentaje}%)`, {
        x: 350,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4),
      })

      yPosition -= 22
    })

    yPosition -= 15
    pageSocios.drawLine({
      start: { x: 90, y: yPosition },
      end: { x: 420, y: yPosition },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    })

    yPosition -= 25
    pageSocios.drawText("TOTAL:", {
      x: 90,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    pageSocios.drawText(`${totalSocios} socios`, {
      x: 250,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    const pageIngresos = pdfDoc.addPage([595, 842])
    yPosition = await agregarEncabezado(pageIngresos, "2. ANÁLISIS DE INGRESOS", 3, 4)

    yPosition -= 20
    pageIngresos.drawText("Ingresos generados en el período seleccionado", {
      x: 70,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    yPosition -= 40

    // Métricas principales
    const boxWidth = 150
    const boxHeight = 70
    const spacing = 20

    // Box 1: Total
    pageIngresos.drawRectangle({
      x: 70,
      y: yPosition - boxHeight,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0.23, 0.51, 0.96),
      borderWidth: 1,
    })

    pageIngresos.drawText("TOTAL INGRESOS", {
      x: 85,
      y: yPosition - 25,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    pageIngresos.drawText(`$${ingresos.totalPagos.toLocaleString()}`, {
      x: 85,
      y: yPosition - 50,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.23, 0.51, 0.96),
    })

    // Box 2: Número de pagos
    pageIngresos.drawRectangle({
      x: 70 + boxWidth + spacing,
      y: yPosition - boxHeight,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0.23, 0.51, 0.96),
      borderWidth: 1,
    })

    pageIngresos.drawText("NÚMERO DE PAGOS", {
      x: 85 + boxWidth + spacing,
      y: yPosition - 25,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    pageIngresos.drawText(`${ingresos.numeroPagos}`, {
      x: 85 + boxWidth + spacing,
      y: yPosition - 50,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.23, 0.51, 0.96),
    })

    // Box 3: Promedio
    pageIngresos.drawRectangle({
      x: 70 + (boxWidth + spacing) * 2,
      y: yPosition - boxHeight,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0.23, 0.51, 0.96),
      borderWidth: 1,
    })

    pageIngresos.drawText("PROMEDIO", {
      x: 85 + (boxWidth + spacing) * 2,
      y: yPosition - 25,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    pageIngresos.drawText(`$${ingresos.promedioIngreso.toFixed(2)}`, {
      x: 85 + (boxWidth + spacing) * 2,
      y: yPosition - 50,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0.23, 0.51, 0.96),
    })

    yPosition -= boxHeight + 50

    pageIngresos.drawText("INGRESOS POR TIPO DE MEMBRESÍA", {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPosition -= 280
    pageIngresos.drawImage(ingresosChart, {
      x: chartX,
      y: yPosition,
      width: chartWidth,
      height: chartHeight,
    })

    const pageAsistencia = pdfDoc.addPage([595, 842])
    yPosition = await agregarEncabezado(pageAsistencia, "3. ANÁLISIS DE ASISTENCIA", 4, 4)

    yPosition -= 20
    pageAsistencia.drawText("Registro de asistencias y uso de instalaciones", {
      x: 70,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    yPosition -= 40

    // Métricas de asistencia
    pageAsistencia.drawRectangle({
      x: 70,
      y: yPosition - boxHeight,
      width: boxWidth * 1.5,
      height: boxHeight,
      borderColor: rgb(0.06, 0.73, 0.51),
      borderWidth: 1,
    })

    pageAsistencia.drawText("TOTAL DE ENTRADAS", {
      x: 85,
      y: yPosition - 25,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    pageAsistencia.drawText(`${entradas.totalEntradas}`, {
      x: 85,
      y: yPosition - 50,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.06, 0.73, 0.51),
    })

    const promedioDiario = Math.round(entradas.totalEntradas / 30)

    pageAsistencia.drawRectangle({
      x: 70 + boxWidth * 1.5 + spacing,
      y: yPosition - boxHeight,
      width: boxWidth * 1.5,
      height: boxHeight,
      borderColor: rgb(0.06, 0.73, 0.51),
      borderWidth: 1,
    })

    pageAsistencia.drawText("PROMEDIO DIARIO", {
      x: 85 + boxWidth * 1.5 + spacing,
      y: yPosition - 25,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    pageAsistencia.drawText(`${promedioDiario}`, {
      x: 85 + boxWidth * 1.5 + spacing,
      y: yPosition - 50,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.06, 0.73, 0.51),
    })

    yPosition -= boxHeight + 50

    pageAsistencia.drawText("ASISTENCIA SEMANAL", {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPosition -= 280
    pageAsistencia.drawImage(asistenciaChart, {
      x: chartX,
      y: yPosition,
      width: chartWidth,
      height: chartHeight,
    })

    console.log("[v0] Guardando PDF...")

    const pdfBytes = await pdfDoc.save()

    console.log("[v0] PDF generado exitosamente, bytes:", pdfBytes.length)

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Informe_KPIs_${periodo}_${format(new Date(), "yyyyMMdd")}.pdf"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Error al generar PDF:", error)
    return NextResponse.json(
      {
        error: "Error al generar PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}