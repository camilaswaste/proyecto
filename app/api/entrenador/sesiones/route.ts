import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { NextResponse } from "next/server"

type TipoSesion = "Personal" | "Grupal"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entrenadorID = searchParams.get("entrenadorID")

    if (!entrenadorID) {
      return NextResponse.json({ error: "EntrenadorID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    // Normalizamos columnas para devolver TODO en un solo listado
    // Personal -> SesionesPersonales
    // Grupal  -> Clases + ReservasClases
    const result = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT
          CAST('Personal' AS VARCHAR(20)) AS Tipo,
          sp.SesionID AS ItemID,
          NULL AS ClaseID,
          NULL AS ReservaID,
          CAST('Sesión Personal' AS NVARCHAR(100)) AS NombreActividad,
          sp.Notas AS Descripcion,
          NULL AS DiaSemana,
          CONVERT(VARCHAR(5), sp.HoraInicio, 108) AS HoraInicio,
          CONVERT(VARCHAR(5), sp.HoraFin, 108) AS HoraFin,
          NULL AS CupoMaximo,
          CAST('Personalizado' AS NVARCHAR(50)) AS Categoria,
          NULL AS TipoClase,
          NULL AS FechaInicio,
          NULL AS FechaFin,
          CONVERT(VARCHAR(10), sp.FechaSesion, 23) AS FechaActividad,
          sp.Estado AS Estado,
          sp.FechaCreacion AS FechaRegistro,
          s.SocioID,
          (s.Nombre + ' ' + s.Apellido) AS NombreSocio,
          s.Email AS EmailSocio,
          s.Telefono AS TelefonoSocio
        FROM SesionesPersonales sp
        INNER JOIN Socios s ON sp.SocioID = s.SocioID
        WHERE sp.EntrenadorID = @entrenadorID

        UNION ALL

        SELECT
          CAST('Grupal' AS VARCHAR(20)) AS Tipo,
          rc.ReservaID AS ItemID,
          c.ClaseID AS ClaseID,
          rc.ReservaID AS ReservaID,
          c.NombreClase AS NombreActividad,
          c.Descripcion AS Descripcion,
          c.DiaSemana AS DiaSemana,
          CONVERT(VARCHAR(5), c.HoraInicio, 108) AS HoraInicio,
          CONVERT(VARCHAR(5), c.HoraFin, 108) AS HoraFin,
          c.CupoMaximo AS CupoMaximo,
          c.Categoria AS Categoria,
          c.TipoClase AS TipoClase,
          CONVERT(VARCHAR(10), c.FechaInicio, 23) AS FechaInicio,
          CONVERT(VARCHAR(10), c.FechaFin, 23) AS FechaFin,
          CONVERT(VARCHAR(10), rc.FechaClase, 23) AS FechaActividad,
          rc.Estado AS Estado,
          rc.FechaReserva AS FechaRegistro,
          s.SocioID,
          (s.Nombre + ' ' + s.Apellido) AS NombreSocio,
          s.Email AS EmailSocio,
          s.Telefono AS TelefonoSocio
        FROM Clases c
        INNER JOIN ReservasClases rc ON c.ClaseID = rc.ClaseID
        INNER JOIN Socios s ON rc.SocioID = s.SocioID
        WHERE c.EntrenadorID = @entrenadorID
          AND c.Activa = 1
          AND (c.FechaFin IS NULL OR c.FechaFin >= CAST(GETDATE() AS DATE))

        ORDER BY FechaActividad DESC, HoraInicio DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener sesiones del entrenador:", error)
    return NextResponse.json({ error: "Error al obtener sesiones" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemID = searchParams.get("itemID")
    const tipo = (searchParams.get("tipo") || "") as TipoSesion
    const { estado } = await request.json()

    if (!itemID) return NextResponse.json({ error: "itemID es requerido" }, { status: 400 })
    if (tipo !== "Personal" && tipo !== "Grupal") {
      return NextResponse.json({ error: "tipo inválido (Personal|Grupal)" }, { status: 400 })
    }

    const pool = await getConnection()

    if (tipo === "Grupal") {
      if (!["Reservada", "Asistió", "NoAsistió", "Cancelada", "Reprogramada"].includes(estado)) {
        return NextResponse.json({ error: "Estado inválido para grupal" }, { status: 400 })
      }

      await pool
        .request()
        .input("reservaID", itemID)
        .input("estado", estado)
        .query(`
          UPDATE ReservasClases
          SET Estado = @estado
          WHERE ReservaID = @reservaID
        `)

      return NextResponse.json({ message: "Estado grupal actualizado" })
    }

    // Personal
    if (!["Agendada", "Completada", "NoAsistio", "Cancelada"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido para personal" }, { status: 400 })
    }

    await pool
      .request()
      .input("sesionID", itemID)
      .input("estado", estado)
      .query(`
        UPDATE SesionesPersonales
        SET Estado = @estado, FechaModificacion = GETDATE()
        WHERE SesionID = @sesionID
      `)

    return NextResponse.json({ message: "Estado personal actualizado" })
  } catch (error) {
    console.error("Error al actualizar estado:", error)
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemID = searchParams.get("itemID")
    const tipo = (searchParams.get("tipo") || "") as TipoSesion

    if (!itemID) return NextResponse.json({ error: "itemID es requerido" }, { status: 400 })
    if (tipo !== "Personal" && tipo !== "Grupal") {
      return NextResponse.json({ error: "tipo inválido (Personal|Grupal)" }, { status: 400 })
    }

    const pool = await getConnection()

    if (tipo === "Grupal") {
      // Cancelación de reserva grupal (soft)
      await pool
        .request()
        .input("reservaID", itemID)
        .query(`
          UPDATE ReservasClases
          SET Estado = 'Cancelada'
          WHERE ReservaID = @reservaID
        `)

      return NextResponse.json({ message: "Reserva grupal cancelada" })
    }

    // Cancelación de sesión personal (soft)
    const sesionInfo = await pool
      .request()
      .input("sesionID", itemID)
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

    await pool
      .request()
      .input("sesionID", itemID)
      .query(`
        UPDATE SesionesPersonales
        SET Estado = 'Cancelada', FechaModificacion = GETDATE()
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
      console.error("[notif] Error al enviar notificaciones (no crítico):", notifError)
    }

    return NextResponse.json({ message: "Sesión personal cancelada" })
  } catch (error) {
    console.error("Error al cancelar:", error)
    return NextResponse.json({ error: "Error al cancelar" }, { status: 500 })
  }
}
