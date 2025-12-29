import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioID = searchParams.get("usuarioID")

    if (!usuarioID) {
      return NextResponse.json({ error: "UsuarioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const entrenadorResult = await pool
      .request()
      .input("usuarioID", usuarioID)
      .query(`
        SELECT EntrenadorID 
        FROM Entrenadores 
        WHERE UsuarioID = @usuarioID AND Activo = 1
      `)

    if (entrenadorResult.recordset.length === 0) {
      return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 404 })
    }

    const entrenadorID = entrenadorResult.recordset[0].EntrenadorID

    const sociosResult = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT COUNT(DISTINCT s.SocioID) as Total
        FROM Socios s
        INNER JOIN SesionesPersonales ses ON s.SocioID = ses.SocioID
        WHERE ses.EntrenadorID = @entrenadorID 
          AND s.EstadoSocio = 'Activo'
          AND ses.FechaSesion >= DATEADD(month, -1, GETDATE())
      `)

    const hoy = new Date().toISOString().split("T")[0]

    const sesionesHoyResult = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("hoy", hoy)
      .query(`
        SELECT COUNT(*) as Total
        FROM SesionesPersonales
        WHERE EntrenadorID = @entrenadorID 
          AND CAST(FechaSesion AS DATE) = @hoy
          AND Estado != 'Cancelada'
      `)

    const clasesSemanalesResult = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT COUNT(*) as Total
        FROM Clases
        WHERE EntrenadorID = @entrenadorID AND Activa = 1
      `)

    const asistenciaResult = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT 
          COALESCE(COUNT(CASE WHEN Estado = 'Completada' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 0) as Promedio
        FROM SesionesPersonales
        WHERE EntrenadorID = @entrenadorID 
          AND FechaSesion >= DATEADD(month, -1, GETDATE())
          AND FechaSesion <= GETDATE()
          AND Estado IN ('Completada', 'Cancelada')
      `)

    const agendaHoyResult = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("hoy", hoy)
      .query(`
        SELECT 
          'sesion' as Tipo,
          sp.SesionID as ID,
          CONVERT(VARCHAR(5), sp.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), sp.HoraFin, 108) as HoraFin,
          COALESCE(so.Nombre, '') + ' ' + COALESCE(so.Apellido, '') as NombreSocio,
          sp.Estado
        FROM SesionesPersonales sp
        INNER JOIN Socios so ON sp.SocioID = so.SocioID
        WHERE sp.EntrenadorID = @entrenadorID 
          AND CAST(sp.FechaSesion AS DATE) = @hoy
          AND sp.Estado != 'Cancelada'
        
        UNION ALL
        
        SELECT 
          'clase' as Tipo,
          c.ClaseID as ID,
          CONVERT(VARCHAR(5), c.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), c.HoraFin, 108) as HoraFin,
          c.NombreClase as NombreSocio,
          'Clase Grupal' as Estado
        FROM Clases c
        WHERE c.EntrenadorID = @entrenadorID 
          AND c.Activa = 1
          AND c.DiaSemana = DATENAME(WEEKDAY, @hoy)
        
        ORDER BY HoraInicio
      `)

    const result = {
      sociosAsignados: sociosResult.recordset[0]?.Total || 0,
      sesionesHoy: sesionesHoyResult.recordset[0]?.Total || 0,
      clasesSemanales: clasesSemanalesResult.recordset[0]?.Total || 0,
      asistenciaPromedio: Math.round(asistenciaResult.recordset[0]?.Promedio || 0),
      agendaHoy: agendaHoyResult.recordset || [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error detallado al obtener dashboard:", error)
    return NextResponse.json(
      {
        error: "Error al obtener dashboard del entrenador",
        detalles: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
