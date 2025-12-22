import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entrenadorID = searchParams.get("entrenadorID")

    if (!entrenadorID) {
      return NextResponse.json({ error: "EntrenadorID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT 
          sp.SesionID,
          CONVERT(VARCHAR(10), sp.FechaSesion, 23) as FechaSesion,
          CONVERT(VARCHAR(5), sp.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), sp.HoraFin, 108) as HoraFin,
          sp.Estado,
          sp.Notas,
          s.Nombre + ' ' + s.Apellido as NombreSocio,
          s.Email as EmailSocio,
          s.Telefono as TelefonoSocio
        FROM SesionesPersonales sp
        INNER JOIN Socios s ON sp.SocioID = s.SocioID
        WHERE sp.EntrenadorID = @entrenadorID
        ORDER BY sp.FechaSesion DESC, sp.HoraInicio DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener sesiones del entrenador:", error)
    return NextResponse.json({ error: "Error al obtener sesiones" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sesionID = searchParams.get("sesionID")

    if (!sesionID) {
      return NextResponse.json({ error: "SesionID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const sesionInfo = await pool
      .request()
      .input("sesionID", sesionID)
      .query(`
        SELECT sp.FechaSesion, sp.HoraInicio, sp.HoraFin, sp.EntrenadorID, sp.SocioID, sp.Estado,
               s.Nombre + ' ' + s.Apellido as NombreSocio,
               u.Nombre + ' ' + u.Apellido as NombreEntrenador
        FROM SesionesPersonales sp
        INNER JOIN Socios s ON sp.SocioID = s.SocioID
        INNER JOIN Entrenadores e ON sp.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE sp.SesionID = @sesionID
      `)

    if (sesionInfo.recordset.length === 0) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    }

    const sesion = sesionInfo.recordset[0]

    if (sesion.Estado !== "Agendada") {
      return NextResponse.json({ error: "Solo se pueden cancelar sesiones en estado 'Agendada'" }, { status: 400 })
    }

    // Cancelar la sesión
    await pool
      .request()
      .input("sesionID", sesionID)
      .query(`
        UPDATE SesionesPersonales
        SET Estado = 'Cancelada'
        WHERE SesionID = @sesionID
      `)

    try {
      await crearNotificacion({
        tipoUsuario: "Socio",
        usuarioID: sesion.SocioID,
        tipoEvento: "sesion_cancelada_entrenador",
        titulo: "Sesión personal cancelada",
        mensaje: `${sesion.NombreEntrenador} ha cancelado tu sesión personal del ${sesion.FechaSesion} de ${sesion.HoraInicio} a ${sesion.HoraFin}.`,
      })

      await crearNotificacion({
        tipoUsuario: "Admin",
        usuarioID: undefined,
        tipoEvento: "sesion_cancelada_entrenador",
        titulo: "Sesión personal cancelada",
        mensaje: `${sesion.NombreEntrenador} ha cancelado su sesión personal con ${sesion.NombreSocio} del ${sesion.FechaSesion}.`,
      })
    } catch (notifError) {
      console.error("[v0] Error al enviar notificaciones (no crítico):", notifError)
    }

    return NextResponse.json({ message: "Sesión cancelada exitosamente" })
  } catch (error) {
    console.error("Error al cancelar sesión:", error)
    return NextResponse.json({ error: "Error al cancelar sesión" }, { status: 500 })
  }
}
