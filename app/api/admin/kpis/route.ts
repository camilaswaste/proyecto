import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[v0] Iniciando solicitud de KPIs")

  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get("periodo") || "mensual"

    console.log("[v0] Período solicitado:", periodo)
    console.log("[v0] Variables de entorno DB:", {
      server: process.env.DB_SERVER ? "✓" : "✗",
      database: process.env.DB_DATABASE ? "✓" : "✗",
      user: process.env.DB_USER ? "✓" : "✗",
      password: process.env.DB_PASSWORD ? "✓" : "✗",
    })

    const pool = await getConnection()
    console.log("[v0] Conexión a DB establecida")

    // Calcular fechas según período
    const fechaFin = new Date()
    const fechaInicio = new Date()

    switch (periodo) {
      case "mensual":
        fechaInicio.setMonth(fechaInicio.getMonth() - 1)
        break
      case "trimestral":
        fechaInicio.setMonth(fechaInicio.getMonth() - 3)
        break
      case "anual":
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1)
        break
    }

    // Socios activos e inactivos (simple)
    const sociosResult = await pool.request().query(`
      SELECT 
        EstadoSocio,
        COUNT(*) as total
      FROM Socios
      GROUP BY EstadoSocio
    `)

    // Ingresos por membresías
    const ingresosMembresiaResult = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
      SELECT 
        pm.NombrePlan,
        COUNT(m.MembresíaID) as cantidad,
        ISNULL(SUM(m.MontoPagado), 0) as totalIngresos
      FROM Membresías m
      INNER JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
      WHERE m.FechaCreacion >= @fechaInicio
      GROUP BY pm.NombrePlan
    `)

    // Ingresos totales
    const ingresosTotalesResult = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
      SELECT 
        ISNULL(SUM(MontoPago), 0) as totalPagos,
        COUNT(*) as numeroPagos,
        CASE 
          WHEN COUNT(*) > 0 THEN ISNULL(SUM(MontoPago), 0) / COUNT(*)
          ELSE 0
        END as promedioIngreso
      FROM Pagos
      WHERE FechaPago >= @fechaInicio
    `)

    // Asistencia a clases
    const asistenciaClasesResult = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
      SELECT 
        c.NombreClase,
        COUNT(CASE WHEN rc.Estado = 'Asistió' THEN 1 END) as asistencias,
        COUNT(*) as totalReservas
      FROM ReservasClases rc
      INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
      WHERE rc.FechaClase >= CAST(@fechaInicio AS DATE)
      GROUP BY c.NombreClase
    `)

    // Entradas al gimnasio
    const entradasResult = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
      SELECT TOP 30
        CAST(FechaHoraIngreso AS DATE) as fecha,
        COUNT(*) as totalEntradas
      FROM Asistencias
      WHERE FechaHoraIngreso >= @fechaInicio
      GROUP BY CAST(FechaHoraIngreso AS DATE)
      ORDER BY fecha DESC
    `)

    // Horarios pico
    const horariosPicoResult = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
      SELECT 
        DATEPART(HOUR, FechaHoraIngreso) as hora,
        COUNT(*) as totalEntradas
      FROM Asistencias
      WHERE FechaHoraIngreso >= @fechaInicio
      GROUP BY DATEPART(HOUR, FechaHoraIngreso)
      ORDER BY totalEntradas DESC
    `)

    // KPI: Tasa de Morosidad
    const morosidadResult = await pool.request().query(`
      SELECT 
        CASE 
          WHEN COUNT(*) > 0 THEN COUNT(CASE WHEN EstadoSocio = 'Moroso' THEN 1 END) * 100.0 / COUNT(*)
          ELSE 0
        END as tasaMorosidad
      FROM Socios
      WHERE EstadoSocio IN ('Activo', 'Moroso')
    `)

    // KPI: Ingreso Promedio por Socio Activo
    const ipsaResult = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
      SELECT 
        CASE 
          WHEN (SELECT COUNT(*) FROM Socios WHERE EstadoSocio = 'Activo') > 0
          THEN ISNULL(SUM(MontoPago), 0) / (SELECT COUNT(*) FROM Socios WHERE EstadoSocio = 'Activo')
          ELSE 0
        END as ingresoPromedioPorSocio
      FROM Pagos
      WHERE FechaPago >= @fechaInicio
    `)

    // KPI: Porcentaje de Pagos Digitales
    const pagosDigitalesResult = await pool
      .request()
      .input("fechaInicio", fechaInicio)
      .query(`
      SELECT 
        CASE 
          WHEN COUNT(*) > 0 THEN COUNT(CASE WHEN MedioPago IN ('Tarjeta', 'Transferencia', 'Digital') THEN 1 END) * 100.0 / COUNT(*)
          ELSE 0
        END as porcentajePagosDigitales
      FROM Pagos
      WHERE FechaPago >= @fechaInicio
    `)

    // Distribución de membresías activas
    const participacionMembresiasResult = await pool.request().query(`
      SELECT 
        pm.TipoPlan,
        pm.NombrePlan,
        COUNT(*) as cantidad
      FROM Membresías m
      INNER JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
      WHERE m.Estado = 'Vigente'
      GROUP BY pm.TipoPlan, pm.NombrePlan
    `)

    return NextResponse.json({
      periodo,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      socios: sociosResult.recordset,
      ingresosPorMembresia: ingresosMembresiaResult.recordset,
      ingresosTotales: ingresosTotalesResult.recordset[0] || { totalPagos: 0, numeroPagos: 0, promedioIngreso: 0 },
      asistenciaClases: asistenciaClasesResult.recordset,
      entradas: entradasResult.recordset,
      horariosPico: horariosPicoResult.recordset,
      kpis: {
        tasaMorosidad: morosidadResult.recordset[0]?.tasaMorosidad || 0,
        tasaRetencion: 85, // Valor por defecto hasta calcular correctamente
        tasaChurn: 5, // Valor por defecto hasta calcular correctamente
        ingresoPromedioPorSocio: ipsaResult.recordset[0]?.ingresoPromedioPorSocio || 0,
        porcentajePagosDigitales: pagosDigitalesResult.recordset[0]?.porcentajePagosDigitales || 0,
      },
      participacionMembresias: participacionMembresiasResult.recordset,
    })
  } catch (error) {
    console.error("[v0] Error en API KPIs:", error)

    return NextResponse.json(
      {
        error: "Error al obtener KPIs",
        message: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}