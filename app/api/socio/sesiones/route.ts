import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const socioID = searchParams.get("socioID")

    if (!socioID) {
      return NextResponse.json({ error: "SocioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("socioID", socioID)
      .query(`
        SELECT 
          sp.SesionID,
          CONVERT(VARCHAR(10), sp.FechaSesion, 23) as FechaSesion,
          CONVERT(VARCHAR(5), sp.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), sp.HoraFin, 108) as HoraFin,
          sp.Estado,
          sp.Notas,
          u.Nombre + ' ' + u.Apellido as NombreEntrenador,
          e.Especialidad,
          e.FotoURL
        FROM SesionesPersonales sp
        INNER JOIN Entrenadores e ON sp.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE sp.SocioID = @socioID
        ORDER BY sp.FechaSesion DESC, sp.HoraInicio DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener sesiones:", error)
    return NextResponse.json({ error: "Error al obtener sesiones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, entrenadorID, fechaSesion, horaInicio, horaFin, notas, forceBooking } = body

    if (!socioID || !entrenadorID || !fechaSesion || !horaInicio || !horaFin) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    const existingSessions = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("fechaSesion", fechaSesion)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .query(`
        SELECT COUNT(*) as Count
        FROM SesionesPersonales
        WHERE EntrenadorID = @entrenadorID
          AND FechaSesion = @fechaSesion
          AND Estado != 'Cancelada'
          AND (
            (HoraInicio < @horaFin AND HoraFin > @horaInicio)
          )
      `)

    const sessionCount = existingSessions.recordset[0].Count

    // Si hay conflicto y el usuario NO confirmó, retornar advertencia
    if (sessionCount > 0 && !forceBooking) {
      return NextResponse.json(
        {
          warning: true,
          sessionCount: sessionCount,
          message: `El entrenador ya tiene ${sessionCount} sesión(es) personal(es) agendada(s) en este horario con otro(s) socio(s).`,
        },
        { status: 200 },
      )
    }

    const dayResult = await pool
      .request()
      .input("fechaSesion", fechaSesion)
      .query(`
        SELECT 
          CASE DATEPART(weekday, @fechaSesion)
            WHEN 1 THEN 'Domingo'
            WHEN 2 THEN 'Lunes'
            WHEN 3 THEN 'Martes'
            WHEN 4 THEN 'Miércoles'
            WHEN 5 THEN 'Jueves'
            WHEN 6 THEN 'Viernes'
            WHEN 7 THEN 'Sábado'
          END as DiaSemana
      `)

    const dayOfWeek = dayResult.recordset[0].DiaSemana

    // Verificar conflictos con clases grupales (esto SÍ bloquea)
    const trainerClasses = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("diaSemana", dayOfWeek)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .query(`
        SELECT COUNT(*) as Count
        FROM Clases
        WHERE EntrenadorID = @entrenadorID
          AND DiaSemana = @diaSemana
          AND Activa = 1
          AND (
            (HoraInicio < @horaFin AND HoraFin > @horaInicio)
          )
      `)

    if (trainerClasses.recordset[0].Count > 0) {
      return NextResponse.json(
        {
          error:
            "El entrenador tiene una clase grupal agendada en ese horario. No puede dar una sesión personal simultáneamente.",
        },
        { status: 409 },
      )
    }

    await pool
      .request()
      .input("socioID", socioID)
      .input("entrenadorID", entrenadorID)
      .input("fechaSesion", fechaSesion)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .input("notas", notas || null)
      .query(`
        INSERT INTO SesionesPersonales (SocioID, EntrenadorID, FechaSesion, HoraInicio, HoraFin, Estado, Notas)
        VALUES (@socioID, @entrenadorID, @fechaSesion, @horaInicio, @horaFin, 'Agendada', @notas)
      `)

    const socioInfo = await pool
      .request()
      .input("socioID", socioID)
      .query(`
        SELECT Nombre + ' ' + Apellido as NombreSocio
        FROM Socios
        WHERE SocioID = @socioID
      `)

    const nombreSocio = socioInfo.recordset[0].NombreSocio

    try {
      await crearNotificacion({
        tipoUsuario: "Entrenador",
        usuarioID: entrenadorID,
        tipoEvento: "sesion_agendada",
        titulo: "Nueva sesión personal agendada",
        mensaje: `${nombreSocio} ha agendado una sesión personal contigo el ${fechaSesion} de ${horaInicio} a ${horaFin}.`,
      })

      await crearNotificacion({
        tipoUsuario: "Admin",
        usuarioID: undefined,
        tipoEvento: "sesion_agendada",
        titulo: "Sesión personal agendada",
        mensaje: `${nombreSocio} ha agendado una sesión personal el ${fechaSesion} de ${horaInicio} a ${horaFin}.`,
      })
    } catch (notifError) {
      console.error("[v0] Error al enviar notificaciones (no crítico):", notifError)
    }

    return NextResponse.json({ message: "Sesión agendada exitosamente" }, { status: 201 })
  } catch (error) {
    console.error("Error al agendar sesión:", error)
    return NextResponse.json({ error: "Error al agendar sesión" }, { status: 500 })
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
        SELECT sp.FechaSesion, sp.HoraInicio, sp.HoraFin, sp.EntrenadorID, sp.SocioID,
               s.Nombre + ' ' + s.Apellido as NombreSocio,
               u.Nombre + ' ' + u.Apellido as NombreEntrenador
        FROM SesionesPersonales sp
        INNER JOIN Socios s ON sp.SocioID = s.SocioID
        INNER JOIN Entrenadores e ON sp.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE sp.SesionID = @sesionID
      `)

    const sesion = sesionInfo.recordset[0]

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
        tipoUsuario: "Entrenador",
        usuarioID: sesion.EntrenadorID,
        tipoEvento: "sesion_cancelada_socio",
        titulo: "Sesión personal cancelada",
        mensaje: `${sesion.NombreSocio} ha cancelado su sesión personal del ${sesion.FechaSesion} de ${sesion.HoraInicio} a ${sesion.HoraFin}.`,
      })

      await crearNotificacion({
        tipoUsuario: "Admin",
        usuarioID: undefined,
        tipoEvento: "sesion_cancelada_socio",
        titulo: "Sesión personal cancelada",
        mensaje: `${sesion.NombreSocio} ha cancelado su sesión personal con ${sesion.NombreEntrenador} del ${sesion.FechaSesion}.`,
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
