import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

type Periodo = "mensual" | "trimestral" | "anual"

function getFechaInicio(periodo: Periodo) {
  const d = new Date()
  switch (periodo) {
    case "mensual":
      d.setMonth(d.getMonth() - 1)
      break
    case "trimestral":
      d.setMonth(d.getMonth() - 3)
      break
    case "anual":
      d.setFullYear(d.getFullYear() - 1)
      break
  }
  return d
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = (searchParams.get("periodo") as Periodo) || "mensual"
    const fechaInicio = getFechaInicio(periodo)

    const pool = await getConnection()

    // 1) Socios activos
    const sociosActivosQ = await pool.request().query(`
      SELECT COUNT(*) as sociosActivos
      FROM Socios
      WHERE EstadoSocio = 'Activo'
    `)

    // 2) Ingresos del período (Pagos)
    const ingresosQ = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
        SELECT ISNULL(SUM(MontoPago), 0) as ingresosPeriodo
        FROM Pagos
        WHERE FechaPago >= @fechaInicio
      `)

    // 3) Clases activas
    const clasesActivasQ = await pool.request().query(`
      SELECT COUNT(*) as clasesActivas
      FROM Clases
      WHERE Activa = 1
    `)

    // 4) Entrenadores activos
    const entrenadoresQ = await pool.request().query(`
      SELECT COUNT(*) as entrenadoresActivos
      FROM Entrenadores
      WHERE Activo = 1
    `)

    // 5) Entradas (Asistencias) del período
    const asistenciasQ = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
        SELECT COUNT(*) as totalEntradasPeriodo
        FROM Asistencias
        WHERE FechaHoraIngreso >= @fechaInicio
      `)

    // 6) Ventas del período (Ventas)
    const ventasQ = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
        SELECT ISNULL(SUM(MontoTotal), 0) as ventasPeriodo
        FROM Ventas
        WHERE FechaVenta >= @fechaInicio
      `)

    // 7) Stock bajo
    const stockBajoQ = await pool.request().query(`
      SELECT COUNT(*) as productosStockBajo
      FROM Inventario
      WHERE StockActual <= StockMinimo
    `)

    // 8) % pagos digitales (opcional pero útil en dashboard)
    const pagosDigitalesQ = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
        SELECT 
          CASE 
            WHEN COUNT(*) > 0 THEN COUNT(CASE WHEN MedioPago IN ('Tarjeta','Transferencia','Digital') THEN 1 END) * 100.0 / COUNT(*)
            ELSE 0
          END as porcentajePagosDigitales
        FROM Pagos
        WHERE FechaPago >= @fechaInicio
      `)

    return NextResponse.json({
      periodo,
      fechaInicio: fechaInicio.toISOString(),

      // Payload “dashboard-friendly”
      sociosActivos: Number(sociosActivosQ.recordset?.[0]?.sociosActivos ?? 0),
      ingresosPeriodo: Number(ingresosQ.recordset?.[0]?.ingresosPeriodo ?? 0),
      clasesActivas: Number(clasesActivasQ.recordset?.[0]?.clasesActivas ?? 0),
      entrenadoresActivos: Number(entrenadoresQ.recordset?.[0]?.entrenadoresActivos ?? 0),

      totalEntradasPeriodo: Number(asistenciasQ.recordset?.[0]?.totalEntradasPeriodo ?? 0),
      ventasPeriodo: Number(ventasQ.recordset?.[0]?.ventasPeriodo ?? 0),
      productosStockBajo: Number(stockBajoQ.recordset?.[0]?.productosStockBajo ?? 0),
      porcentajePagosDigitales: Number(pagosDigitalesQ.recordset?.[0]?.porcentajePagosDigitales ?? 0),
    })
  } catch (error) {
    console.error("[dashboard] Error:", error)
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard", message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}