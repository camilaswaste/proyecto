import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoReporte = searchParams.get("tipo") || "general"
    const fechaDesde = searchParams.get("desde") || ""
    const fechaHasta = searchParams.get("hasta") || ""

    const pool = await getConnection()

    let whereClause = ""
    if (fechaDesde && fechaHasta) {
      whereClause = `WHERE FechaPago BETWEEN '${fechaDesde}' AND '${fechaHasta}'`
    }

    let datos = {}

    switch (tipoReporte) {
      case "ingresos":
        const ingresosDetalle = await pool.request().query(`
          SELECT 
            p.PagoID,
            p.FechaPago,
            s.Nombre + ' ' + s.Apellido as nombreSocio,
            p.Concepto,
            p.MontoPago,
            p.MedioPago,
            pm.NombrePlan
          FROM Pagos p
          INNER JOIN Socios s ON p.SocioID = s.SocioID
          LEFT JOIN Membresías m ON p.MembresíaID = m.MembresíaID
          LEFT JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
          ${whereClause}
          ORDER BY p.FechaPago DESC
        `)

        const resumenIngresos = await pool.request().query(`
          SELECT 
            MedioPago,
            COUNT(*) as cantidad,
            SUM(MontoPago) as total
          FROM Pagos
          ${whereClause}
          GROUP BY MedioPago
        `)

        datos = {
          detalle: ingresosDetalle.recordset,
          resumen: resumenIngresos.recordset,
        }
        break

      case "asistencia":
        const asistenciaClases = await pool.request().query(`
          SELECT 
            c.NombreClase,
            c.DiaSemana,
            c.HoraInicio,
            u.Nombre + ' ' + u.Apellido as entrenador,
            COUNT(*) as totalReservas,
            COUNT(CASE WHEN rc.Estado = 'Asistió' THEN 1 END) as asistieron,
            COUNT(CASE WHEN rc.Estado = 'NoAsistió' THEN 1 END) as noAsistieron,
            CAST(COUNT(CASE WHEN rc.Estado = 'Asistió' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) as porcentajeAsistencia
          FROM ReservasClases rc
          INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
          INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
          INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
          ${whereClause.replace("FechaPago", "rc.FechaClase")}
          GROUP BY c.NombreClase, c.DiaSemana, c.HoraInicio, u.Nombre, u.Apellido
          ORDER BY totalReservas DESC
        `)

        datos = {
          asistenciaClases: asistenciaClases.recordset,
        }
        break

      case "socios":
        const sociosEstado = await pool.request().query(`
          SELECT 
            s.SocioID,
            s.Nombre + ' ' + s.Apellido as nombreCompleto,
            s.Email,
            s.EstadoSocio,
            s.FechaRegistro,
            m.FechaVencimiento,
            pm.NombrePlan
          FROM Socios s
          LEFT JOIN Membresías m ON s.SocioID = m.SocioID AND m.Estado = 'Vigente'
          LEFT JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
          ORDER BY s.FechaRegistro DESC
        `)

        const resumenSocios = await pool.request().query(`
          SELECT 
            EstadoSocio,
            COUNT(*) as cantidad
          FROM Socios
          GROUP BY EstadoSocio
        `)

        datos = {
          sociosDetalle: sociosEstado.recordset,
          resumenSocios: resumenSocios.recordset,
        }
        break

      case "financiero":
        const balanceGeneral = await pool.request().query(`
          SELECT 
            'Ingresos' as categoria,
            SUM(MontoPago) as monto
          FROM Pagos
          ${whereClause}
          
          UNION ALL
          
          SELECT 
            'Membresías Vigentes' as categoria,
            COUNT(*) as monto
          FROM Membresías
          WHERE Estado = 'Vigente'
        `)

        const ingresosPorCategoria = await pool.request().query(`
          SELECT 
            CASE 
              WHEN Concepto LIKE '%Membresía%' THEN 'Membresías'
              WHEN Concepto LIKE '%Sesión%' THEN 'Sesiones Personales'
              ELSE 'Otros'
            END as categoria,
            SUM(MontoPago) as total
          FROM Pagos
          ${whereClause}
          GROUP BY CASE 
            WHEN Concepto LIKE '%Membresía%' THEN 'Membresías'
            WHEN Concepto LIKE '%Sesión%' THEN 'Sesiones Personales'
            ELSE 'Otros'
          END
        `)

        datos = {
          balanceGeneral: balanceGeneral.recordset,
          ingresosPorCategoria: ingresosPorCategoria.recordset,
        }
        break

      case "uso":
        const usoGimnasio = await pool.request().query(`
          SELECT 
            DATENAME(WEEKDAY, FechaHoraIngreso) as diaSemana,
            DATEPART(HOUR, FechaHoraIngreso) as hora,
            COUNT(*) as totalEntradas
          FROM Asistencias
          ${whereClause.replace("FechaPago", "FechaHoraIngreso")}
          GROUP BY DATENAME(WEEKDAY, FechaHoraIngreso), DATEPART(HOUR, FechaHoraIngreso)
          ORDER BY totalEntradas DESC
        `)

        const asistenciasDiarias = await pool.request().query(`
          SELECT 
            CAST(FechaHoraIngreso AS DATE) as fecha,
            COUNT(*) as totalEntradas,
            COUNT(DISTINCT SocioID) as sociosUnicos
          FROM Asistencias
          ${whereClause.replace("FechaPago", "FechaHoraIngreso")}
          GROUP BY CAST(FechaHoraIngreso AS DATE)
          ORDER BY fecha DESC
        `)

        datos = {
          usoGimnasio: usoGimnasio.recordset,
          asistenciasDiarias: asistenciasDiarias.recordset,
        }
        break

      default:
        return NextResponse.json({ error: "Tipo de reporte no válido" }, { status: 400 })
    }

    return NextResponse.json({
      tipoReporte,
      fechaDesde,
      fechaHasta,
      datos,
    })
  } catch (error) {
    console.error("[v0] Error al generar reporte:", error)
    return NextResponse.json(
      { error: "Error al generar reporte", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}