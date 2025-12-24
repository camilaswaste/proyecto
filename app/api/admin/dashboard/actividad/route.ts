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

    // Importante: evitar FORMAT() y concatenaciones con NULL
    const query = `
      SELECT TOP 25 *
      FROM (
        /* PAGOS */
        SELECT
          CONCAT('Pago-', p.PagoID) AS id,
          'Pago' AS tipo,
          CONCAT('Pago registrado: $', CAST(CAST(p.MontoPago AS BIGINT) AS VARCHAR(30))) AS titulo,
          CONCAT(
            'Socio: ',
            ISNULL(s.Nombre, 'Desconocido'), ' ', ISNULL(s.Apellido, ''),
            ' · Medio: ', ISNULL(p.MedioPago, 'N/A')
          ) AS detalle,
          p.FechaPago AS fecha
        FROM Pagos p
        LEFT JOIN Socios s ON s.SocioID = p.SocioID
        WHERE p.FechaPago >= @fechaInicio

        UNION ALL

        /* VENTAS */
        SELECT
          CONCAT('Venta-', v.VentaID) AS id,
          'Venta' AS tipo,
          CONCAT('Venta registrada: $', CAST(CAST(v.MontoTotal AS BIGINT) AS VARCHAR(30))) AS titulo,
          CONCAT(
            'Registrado por: ',
            ISNULL(u.Nombre, 'Desconocido'), ' ', ISNULL(u.Apellido, ''),
            ' · Método: ', ISNULL(v.MetodoPago, 'N/A'),
            ' · Tipo: ', ISNULL(v.TipoVenta, 'N/A')
          ) AS detalle,
          v.FechaVenta AS fecha
        FROM Ventas v
        LEFT JOIN Usuarios u ON u.UsuarioID = v.UsuarioRegistro
        WHERE v.FechaVenta >= @fechaInicio

        UNION ALL

        /* RESERVAS CLASES */
        SELECT
          CONCAT('Reserva-', r.ReservaID) AS id,
          'ReservaClase' AS tipo,
          CONCAT('Reserva de clase: ', ISNULL(c.NombreClase, 'Clase')) AS titulo,
          CONCAT(
            'Socio: ',
            ISNULL(s2.Nombre, 'Desconocido'), ' ', ISNULL(s2.Apellido, ''),
            ' · Estado: ', ISNULL(r.Estado, 'N/A'),
            ' · Fecha clase: ', CONVERT(varchar(10), r.FechaClase, 120)
          ) AS detalle,
          r.FechaReserva AS fecha
        FROM ReservasClases r
        LEFT JOIN Clases c ON c.ClaseID = r.ClaseID
        LEFT JOIN Socios s2 ON s2.SocioID = r.SocioID
        WHERE r.FechaReserva >= @fechaInicio

        UNION ALL

        /* INGRESOS */
        SELECT
          CONCAT('Ingreso-', a.AsistenciaID) AS id,
          'Ingreso' AS tipo,
          'Ingreso al gimnasio' AS titulo,
          CONCAT(
            'Socio: ',
            ISNULL(s3.Nombre, 'Desconocido'), ' ', ISNULL(s3.Apellido, '')
          ) AS detalle,
          a.FechaHoraIngreso AS fecha
        FROM Asistencias a
        LEFT JOIN Socios s3 ON s3.SocioID = a.SocioID
        WHERE a.FechaHoraIngreso >= @fechaInicio

        UNION ALL

        /* NUEVOS SOCIOS */
        SELECT
          CONCAT('Socio-', s4.SocioID) AS id,
          'NuevoSocio' AS tipo,
          'Nuevo socio registrado' AS titulo,
          CONCAT(
            ISNULL(s4.Nombre, 'Desconocido'), ' ', ISNULL(s4.Apellido, ''),
            ' · Email: ', ISNULL(s4.Email, 'N/A')
          ) AS detalle,
          s4.FechaRegistro AS fecha
        FROM Socios s4
        WHERE s4.FechaRegistro >= @fechaInicio
      ) X
      ORDER BY fecha DESC;
    `

    const result = await pool.request().input("fechaInicio", fechaInicio).query(query)

    return NextResponse.json({
      periodo,
      fechaInicio: fechaInicio.toISOString(),
      items: result.recordset,
    })
  } catch (error) {
    // Esto te mostrará el error real en la consola del servidor
    console.error("[dashboard/actividad] Error:", error)

    // Para depurar rápido en dev, devolvemos el message
    return NextResponse.json(
      {
        error: "Error al obtener actividad",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}