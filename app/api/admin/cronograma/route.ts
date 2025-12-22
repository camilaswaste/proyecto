import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0]

    console.log("[v0] Cronograma Admin - Fecha solicitada:", fecha)

    const pool = await getConnection()

    const clases = await pool
      .request()
      .input("Fecha", fecha)
      .query(`
      SELECT 
        c.ClaseID,
        c.NombreClase,
        c.DiaSemana,
        CONVERT(VARCHAR(5), c.HoraInicio, 108) as HoraInicio,
        CONVERT(VARCHAR(5), c.HoraFin, 108) as HoraFin,
        c.CupoMaximo,
        u.Nombre + ' ' + u.Apellido as NombreEntrenador,
        (SELECT COUNT(*) FROM ReservasClases rc 
         WHERE rc.ClaseID = c.ClaseID 
         AND rc.Estado = 'Reservada'
         AND rc.FechaClase >= DATEADD(week, DATEDIFF(week, 0, @Fecha), 0)
         AND rc.FechaClase < DATEADD(week, DATEDIFF(week, 0, @Fecha) + 1, 0)
        ) as Inscritos
      FROM Clases c
      INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE c.Activa = 1
      ORDER BY 
        CASE c.DiaSemana
          WHEN 'Lunes' THEN 1
          WHEN 'Martes' THEN 2
          WHEN 'Miércoles' THEN 3
          WHEN 'Jueves' THEN 4
          WHEN 'Viernes' THEN 5
          WHEN 'Sábado' THEN 6
          WHEN 'Domingo' THEN 7
        END,
        c.HoraInicio
    `)

    console.log("[v0] Clases encontradas:", clases.recordset.length)
    console.log("[v0] Primeras clases:", JSON.stringify(clases.recordset.slice(0, 2), null, 2))

    const sesiones = await pool
      .request()
      .input("Fecha", fecha)
      .query(`
      SELECT 
        sp.SesionID,
        CONVERT(VARCHAR(10), sp.FechaSesion, 23) as FechaSesion,
        CONVERT(VARCHAR(5), sp.HoraInicio, 108) as HoraInicio,
        CONVERT(VARCHAR(5), sp.HoraFin, 108) as HoraFin,
        sp.Estado,
        u.Nombre + ' ' + u.Apellido as NombreEntrenador,
        s.Nombre + ' ' + s.Apellido as NombreSocio
      FROM SesionesPersonales sp
      INNER JOIN Entrenadores e ON sp.EntrenadorID = e.EntrenadorID
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      INNER JOIN Socios s ON sp.SocioID = s.SocioID
      WHERE sp.FechaSesion >= DATEADD(week, DATEDIFF(week, 0, @Fecha), 0)
        AND sp.FechaSesion < DATEADD(week, DATEDIFF(week, 0, @Fecha) + 1, 0)
        AND sp.Estado != 'Cancelada'
      ORDER BY sp.FechaSesion, sp.HoraInicio
    `)

    console.log("[v0] Sesiones encontradas:", sesiones.recordset.length)
    console.log("[v0] Primeras sesiones:", JSON.stringify(sesiones.recordset.slice(0, 2), null, 2))

    return NextResponse.json({
      clases: clases.recordset,
      sesiones: sesiones.recordset,
    })
  } catch (error) {
    console.error("[v0] Error al obtener cronograma:", error)
    return NextResponse.json({ error: "Error al obtener cronograma" }, { status: 500 })
  }
}
