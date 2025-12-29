import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { type NextRequest, NextResponse } from "next/server"

// GET - Obtener intercambios pendientes y horarios disponibles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entrenadorId = searchParams.get("entrenadorId")

    console.log("[v0] Intercambios GET - entrenadorId:", entrenadorId)

    if (!entrenadorId) {
      return NextResponse.json({ error: "Falta entrenadorId" }, { status: 400 })
    }

    const pool = await getConnection()

    const misHorarios = await pool
      .request()
      .input("entrenadorId", entrenadorId)
      .query(`
        SELECT 
          hr.HorarioRecepcionID,
          hr.DiaSemana,
          CONVERT(VARCHAR(5), hr.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), hr.HoraFin, 108) as HoraFin
        FROM HorariosRecepcion hr
        WHERE hr.EntrenadorID = @entrenadorId AND hr.Activo = 1
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

    console.log("[v0] Mis horarios encontrados:", misHorarios.recordset.length)

    const otrosHorarios = await pool
      .request()
      .input("entrenadorId", entrenadorId)
      .query(`
        SELECT 
          hr.HorarioRecepcionID,
          hr.EntrenadorID,
          u.Nombre + ' ' + u.Apellido as NombreEntrenador,
          hr.DiaSemana,
          CONVERT(VARCHAR(5), hr.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), hr.HoraFin, 108) as HoraFin
        FROM HorariosRecepcion hr
        INNER JOIN Entrenadores e ON hr.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE hr.EntrenadorID != @entrenadorId AND hr.Activo = 1
        ORDER BY u.Nombre, 
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

    console.log("[v0] Otros horarios encontrados:", otrosHorarios.recordset.length)

    const solicitudesRecibidas = await pool
      .request()
      .input("entrenadorId", entrenadorId)
      .query(`
        SELECT 
          ih.IntercambioID,
          ih.HorarioOrigenID,
          ih.HorarioDestinoID,
          CONVERT(VARCHAR(19), ih.FechaSolicitud, 120) as FechaSolicitud,
          ih.Estado,
          u.Nombre + ' ' + u.Apellido as NombreSolicitante,
          ho.DiaSemana as DiaOrigen,
          CONVERT(VARCHAR(5), ho.HoraInicio, 108) as HoraInicioOrigen,
          CONVERT(VARCHAR(5), ho.HoraFin, 108) as HoraFinOrigen,
          hd.DiaSemana as DiaDestino,
          CONVERT(VARCHAR(5), hd.HoraInicio, 108) as HoraInicioDestino,
          CONVERT(VARCHAR(5), hd.HoraFin, 108) as HoraFinDestino
        FROM IntercambiosHorario ih
        INNER JOIN HorariosRecepcion ho ON ih.HorarioOrigenID = ho.HorarioRecepcionID
        INNER JOIN HorariosRecepcion hd ON ih.HorarioDestinoID = hd.HorarioRecepcionID
        INNER JOIN Entrenadores e ON ho.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE hd.EntrenadorID = @entrenadorId AND ih.Estado = 'Pendiente'
        ORDER BY ih.FechaSolicitud DESC
      `)

    console.log("[v0] Solicitudes recibidas:", solicitudesRecibidas.recordset.length)

    const solicitudesEnviadas = await pool
      .request()
      .input("entrenadorId", entrenadorId)
      .query(`
        SELECT 
          ih.IntercambioID,
          ih.HorarioOrigenID,
          ih.HorarioDestinoID,
          CONVERT(VARCHAR(19), ih.FechaSolicitud, 120) as FechaSolicitud,
          ih.Estado,
          u.Nombre + ' ' + u.Apellido as NombreDestinatario,
          ho.DiaSemana as DiaOrigen,
          CONVERT(VARCHAR(5), ho.HoraInicio, 108) as HoraInicioOrigen,
          CONVERT(VARCHAR(5), ho.HoraFin, 108) as HoraFinOrigen,
          hd.DiaSemana as DiaDestino,
          CONVERT(VARCHAR(5), hd.HoraInicio, 108) as HoraInicioDestino,
          CONVERT(VARCHAR(5), hd.HoraFin, 108) as HoraFinDestino
        FROM IntercambiosHorario ih
        INNER JOIN HorariosRecepcion ho ON ih.HorarioOrigenID = ho.HorarioRecepcionID
        INNER JOIN HorariosRecepcion hd ON ih.HorarioDestinoID = hd.HorarioRecepcionID
        INNER JOIN Entrenadores e ON hd.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE ho.EntrenadorID = @entrenadorId AND ih.Estado = 'Pendiente'
        ORDER BY ih.FechaSolicitud DESC
      `)

    console.log("[v0] Solicitudes enviadas:", solicitudesEnviadas.recordset.length)

    return NextResponse.json({
      misHorarios: misHorarios.recordset,
      otrosHorarios: otrosHorarios.recordset,
      solicitudesRecibidas: solicitudesRecibidas.recordset,
      solicitudesEnviadas: solicitudesEnviadas.recordset,
    })
  } catch (error) {
    console.error("[v0] Error al obtener intercambios:", error)
    return NextResponse.json({ error: "Error al obtener intercambios" }, { status: 500 })
  }
}

// POST - Crear solicitud de intercambio
export async function POST(request: NextRequest) {
  try {
    const { horarioOrigenId, horarioDestinoId } = await request.json()

    console.log("[v0] Intercambios POST - origen:", horarioOrigenId, "destino:", horarioDestinoId)

    if (!horarioOrigenId || !horarioDestinoId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    const horarios = await pool
      .request()
      .input("horarioOrigenId", horarioOrigenId)
      .input("horarioDestinoId", horarioDestinoId)
      .query(`
        SELECT 
          hr.HorarioRecepcionID, 
          hr.EntrenadorID,
          hr.DiaSemana,
          CONVERT(VARCHAR(5), hr.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), hr.HoraFin, 108) as HoraFin,
          u.Nombre + ' ' + u.Apellido as NombreEntrenador
        FROM HorariosRecepcion hr
        INNER JOIN Entrenadores e ON hr.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE hr.HorarioRecepcionID IN (@horarioOrigenId, @horarioDestinoId)
      `)

    if (horarios.recordset.length !== 2) {
      return NextResponse.json({ error: "Horarios no encontrados" }, { status: 404 })
    }

    const horarioOrigen = horarios.recordset.find((h: any) => h.HorarioRecepcionID === horarioOrigenId)

    const horarioDestino = horarios.recordset.find((h: any) => h.HorarioRecepcionID === horarioDestinoId)

    const entrenadorOrigenID = horarioOrigen?.EntrenadorID
    const entrenadorDestinoID = horarioDestino?.EntrenadorID

    console.log("[v0] EntrenadorOrigenID:", entrenadorOrigenID, "EntrenadorDestinoID:", entrenadorDestinoID)

    await pool
      .request()
      .input("entrenadorOrigenId", entrenadorOrigenID)
      .input("entrenadorDestinoId", entrenadorDestinoID)
      .input("horarioOrigenId", horarioOrigenId)
      .input("horarioDestinoId", horarioDestinoId)
      .query(`
        INSERT INTO IntercambiosHorario (EntrenadorOrigenID, EntrenadorDestinoID, HorarioOrigenID, HorarioDestinoID, Estado)
        VALUES (@entrenadorOrigenId, @entrenadorDestinoId, @horarioOrigenId, @horarioDestinoId, 'Pendiente')
      `)

    console.log("[v0] Solicitud de intercambio creada exitosamente")

    try {
      await crearNotificacion({
        tipoUsuario: "Entrenador",
        usuarioID: entrenadorDestinoID,
        tipoEvento: "intercambio_solicitado",
        titulo: "Nueva solicitud de intercambio",
        mensaje: `${horarioOrigen?.NombreEntrenador} solicita intercambiar su turno del ${horarioOrigen?.DiaSemana} de ${horarioOrigen?.HoraInicio} a ${horarioOrigen?.HoraFin} por tu turno del ${horarioDestino?.DiaSemana} de ${horarioDestino?.HoraInicio} a ${horarioDestino?.HoraFin}.`,
      })
    } catch (notifError) {
      console.error("[v0] Error al crear notificación:", notifError)
    }

    return NextResponse.json({ message: "Solicitud de intercambio enviada" })
  } catch (error) {
    console.error("[v0] Error al crear intercambio:", error)
    return NextResponse.json({ error: "Error al crear intercambio" }, { status: 500 })
  }
}

// PUT - Aceptar o rechazar intercambio
export async function PUT(request: NextRequest) {
  try {
    const { intercambioId, accion } = await request.json()

    console.log("[v0] Intercambios PUT - ID:", intercambioId, "accion:", accion)

    if (!intercambioId || !accion) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    if (accion === "aceptar") {
      const intercambio = await pool
        .request()
        .input("intercambioId", intercambioId)
        .query(`
          SELECT 
            ih.HorarioOrigenID, 
            ih.HorarioDestinoID,
            ih.EntrenadorOrigenID,
            ih.EntrenadorDestinoID
          FROM IntercambiosHorario ih
          WHERE ih.IntercambioID = @intercambioId
        `)

      if (intercambio.recordset.length === 0) {
        return NextResponse.json({ error: "Intercambio no encontrado" }, { status: 404 })
      }

      const { HorarioOrigenID, HorarioDestinoID, EntrenadorOrigenID, EntrenadorDestinoID } = intercambio.recordset[0]

      const horarios = await pool
        .request()
        .input("horarioOrigenId", HorarioOrigenID)
        .input("horarioDestinoId", HorarioDestinoID)
        .query(`
          SELECT 
            hr.EntrenadorID, 
            hr.HorarioRecepcionID,
            hr.DiaSemana,
            CONVERT(VARCHAR(5), hr.HoraInicio, 108) as HoraInicio,
            CONVERT(VARCHAR(5), hr.HoraFin, 108) as HoraFin,
            u.Nombre + ' ' + u.Apellido as NombreEntrenador
          FROM HorariosRecepcion hr
          INNER JOIN Entrenadores e ON hr.EntrenadorID = e.EntrenadorID
          INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
          WHERE hr.HorarioRecepcionID IN (@horarioOrigenId, @horarioDestinoId)
        `)

      const horarioOrigen = horarios.recordset.find((h: any) => h.HorarioRecepcionID === HorarioOrigenID)

      const horarioDestino = horarios.recordset.find((h: any) => h.HorarioRecepcionID === HorarioDestinoID)

      const entrenadorOrigen = horarioOrigen?.EntrenadorID
      const entrenadorDestino = horarioDestino?.EntrenadorID

      console.log("[v0] Intercambiando entrenadores:", entrenadorOrigen, "<->", entrenadorDestino)

      await pool
        .request()
        .input("entrenadorDestino", entrenadorDestino)
        .input("horarioOrigenId", HorarioOrigenID)
        .query(`
          UPDATE HorariosRecepcion 
          SET EntrenadorID = @entrenadorDestino
          WHERE HorarioRecepcionID = @horarioOrigenId
        `)

      await pool
        .request()
        .input("entrenadorOrigen", entrenadorOrigen)
        .input("horarioDestinoId", HorarioDestinoID)
        .query(`
          UPDATE HorariosRecepcion 
          SET EntrenadorID = @entrenadorOrigen
          WHERE HorarioRecepcionID = @horarioDestinoId
        `)

      await pool
        .request()
        .input("intercambioId", intercambioId)
        .query(`
          UPDATE IntercambiosHorario
          SET Estado = 'Aprobado', FechaRespuesta = GETDATE()
          WHERE IntercambioID = @intercambioId
        `)

      console.log("[v0] Intercambio completado exitosamente")

      try {
        await crearNotificacion({
          tipoUsuario: "Admin",
          usuarioID: undefined,
          tipoEvento: "intercambio_aprobado",
          titulo: "Intercambio de horario completado",
          mensaje: `${horarioOrigen?.NombreEntrenador} y ${horarioDestino?.NombreEntrenador} han intercambiado sus turnos de recepción (${horarioOrigen?.DiaSemana} ${horarioOrigen?.HoraInicio}-${horarioOrigen?.HoraFin} ↔ ${horarioDestino?.DiaSemana} ${horarioDestino?.HoraInicio}-${horarioDestino?.HoraFin}).`,
        })
      } catch (notifError) {
        console.error("[v0] Error al crear notificación:", notifError)
      }

      return NextResponse.json({ message: "Intercambio aceptado exitosamente" })
    } else if (accion === "rechazar") {
      await pool
        .request()
        .input("intercambioId", intercambioId)
        .query(`
          UPDATE IntercambiosHorario
          SET Estado = 'Rechazado', FechaRespuesta = GETDATE()
          WHERE IntercambioID = @intercambioId
        `)

      console.log("[v0] Intercambio rechazado")

      return NextResponse.json({ message: "Intercambio rechazado" })
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error al procesar intercambio:", error)
    return NextResponse.json({ error: "Error al procesar intercambio" }, { status: 500 })
  }
}
