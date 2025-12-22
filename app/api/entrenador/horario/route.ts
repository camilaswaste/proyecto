import { getConnection } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const usuarioID = searchParams.get("usuarioID")

    if (!usuarioID || usuarioID === "undefined") {
      return NextResponse.json({ error: "UsuarioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    // 1. Obtenemos el EntrenadorID asociado al UsuarioID que viene de la sesión
    const entrenadorResult = await pool
      .request()
      .input("usuarioID", sql.Int, Number(usuarioID))
      .query(`
        SELECT EntrenadorID FROM Entrenadores WHERE UsuarioID = @usuarioID
      `)

    if (entrenadorResult.recordset.length === 0) {
      return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 404 })
    }

    const entrenadorID = entrenadorResult.recordset[0].EntrenadorID

    // 2. Obtenemos todos los horarios de recepción
    // Incluimos una columna booleana 'EsMio' para facilitar el resaltado en el frontend
    const horarios = await pool.request()
      .input("miID", sql.Int, entrenadorID)
      .query(`
      SELECT 
        hr.HorarioRecepcionID,
        hr.EntrenadorID,
        hr.DiaSemana,
        CONVERT(VARCHAR(5), hr.HoraInicio, 108) as HoraInicio,
        CONVERT(VARCHAR(5), hr.HoraFin, 108) as HoraFin,
        u.Nombre,
        u.Apellido,
        e.Especialidad,
        CASE WHEN hr.EntrenadorID = @miID THEN 1 ELSE 0 END as EsMio
      FROM HorariosRecepcion hr
      INNER JOIN Entrenadores e ON hr.EntrenadorID = e.EntrenadorID
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE hr.Activo = 1
      ORDER BY 
        CASE hr.DiaSemana
          WHEN 'Lunes' THEN 1
          WHEN 'Martes' THEN 2
          WHEN 'Miércoles' THEN 3
          WHEN 'Jueves' THEN 4
          WHEN 'Viernes' THEN 5
          WHEN 'Sábado' THEN 6
          WHEN 'Domingo' THEN 7
        END,
        hr.HoraInicio
    `)

    return NextResponse.json({ 
      horarios: horarios.recordset,
      miEntrenadorID: entrenadorID 
    })

  } catch (error: any) {
    console.error("[api/entrenador/horario] Error:", error)
    return NextResponse.json({ error: "Error al obtener el horario" }, { status: 500 })
  }
}