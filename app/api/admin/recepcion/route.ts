import { getConnection } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching recepción data...")

    const pool = await getConnection()

    const horarios = await pool.request().query(`
      SELECT 
        hr.HorarioRecepcionID,
        hr.EntrenadorID,
        hr.DiaSemana,
        CONVERT(VARCHAR(5), hr.HoraInicio, 108) as HoraInicio,
        CONVERT(VARCHAR(5), hr.HoraFin, 108) as HoraFin,
        u.Nombre,
        u.Apellido,
        e.Especialidad
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
          ELSE 99
        END,
        hr.HoraInicio
    `)

    const entrenadores = await pool.request().query(`
      SELECT 
        e.EntrenadorID,
        u.Nombre,
        u.Apellido,
        e.Especialidad,
        u.Email
      FROM Entrenadores e
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE u.Activo = 1
      ORDER BY u.Nombre, u.Apellido
    `)

    return NextResponse.json({
      horarios: horarios.recordset,
      entrenadores: entrenadores.recordset,
    })
  } catch (error) {
    console.error("[v0] Error fetching recepción data:", error)
    return NextResponse.json({ error: "Error al obtener datos de recepción" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entrenadorID, diaSemana, horaInicio, horaFin } = body ?? {}

    if (!entrenadorID || !diaSemana || !horaInicio || !horaFin) {
      return NextResponse.json({ error: "Faltan campos: entrenadorID, diaSemana, horaInicio, horaFin" }, { status: 400 })
    }

    // Validación simple (string HH:MM)
    if (String(horaFin) <= String(horaInicio)) {
      return NextResponse.json({ error: "La hora de fin debe ser posterior a la hora de inicio" }, { status: 400 })
    }

    const pool = await getConnection()

    // 1) Validar entrenador activo
    const entrenador = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT e.EntrenadorID
        FROM Entrenadores e
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE e.EntrenadorID = @entrenadorID AND u.Activo = 1
      `)

    if (entrenador.recordset.length === 0) {
      return NextResponse.json({ error: "Entrenador no encontrado o inactivo" }, { status: 404 })
    }

    // 2) NUEVO: bloquear solape GLOBAL en el día (cualquier entrenador)
    // Overlap real: (inicio < finExistente) AND (fin > inicioExistente)
    // Permite “pegados” (13:00-23:00 no choca con 06:00-13:00)
    const conflictoDia = await pool
      .request()
      .input("diaSemana", diaSemana)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .query(`
        SELECT TOP 1
          hr.HorarioRecepcionID,
          hr.HoraInicio,
          hr.HoraFin,
          u.Nombre,
          u.Apellido
        FROM HorariosRecepcion hr
        INNER JOIN Entrenadores e ON hr.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE hr.DiaSemana = @diaSemana
          AND hr.Activo = 1
          AND (@horaInicio < hr.HoraFin AND @horaFin > hr.HoraInicio)
        ORDER BY hr.HoraInicio
      `)

    if (conflictoDia.recordset.length > 0) {
      const c = conflictoDia.recordset[0]
      const hi = String(c.HoraInicio).substring(0, 5)
      const hf = String(c.HoraFin).substring(0, 5)
      return NextResponse.json(
        { error: `Ese tramo se solapa con otro turno (${hi}–${hf}) asignado a ${c.Nombre} ${c.Apellido}.` },
        { status: 400 },
      )
    }

    // 3) Mantener: evitar choque con clases grupales del entrenador
    const conflictoClases = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("diaSemana", diaSemana)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .query(`
        SELECT TOP 1 ClaseID
        FROM Clases
        WHERE EntrenadorID = @entrenadorID
          AND DiaSemana = @diaSemana
          AND Activa = 1
          AND (@horaInicio < HoraFin AND @horaFin > HoraInicio)
      `)

    if (conflictoClases.recordset.length > 0) {
      return NextResponse.json(
        { error: "El entrenador tiene clases grupales programadas en este horario" },
        { status: 400 },
      )
    }

    // 4) Insert (sin romper tus turnos existentes)
    const insert = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("diaSemana", diaSemana)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .query(`
        INSERT INTO HorariosRecepcion (EntrenadorID, DiaSemana, HoraInicio, HoraFin, Activo)
        OUTPUT INSERTED.HorarioRecepcionID
        VALUES (@entrenadorID, @diaSemana, @horaInicio, @horaFin, 1)
      `)

    return NextResponse.json({
      message: "Horario de recepción asignado exitosamente",
      horarioRecepcionID: insert.recordset?.[0]?.HorarioRecepcionID ?? null,
    })
  } catch (error) {
    console.error("Error creating recepción:", error)
    return NextResponse.json({ error: "Error al asignar horario de recepción" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const horarioID = searchParams.get("id")

    if (!horarioID) {
      return NextResponse.json({ error: "ID de horario requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    // Verificar que no haya intercambios pendientes relacionados con este horario
    const intercambiosPendientes = await pool
      .request()
      .input("horarioID", horarioID)
      .query(`
        SELECT IntercambioID
        FROM IntercambiosHorario
        WHERE (HorarioOrigenID = @horarioID OR HorarioDestinoID = @horarioID)
          AND Estado = 'Pendiente'
      `)

    if (intercambiosPendientes.recordset.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: hay solicitudes de intercambio pendientes para este horario" },
        { status: 400 },
      )
    }

    await pool
      .request()
      .input("horarioID", horarioID)
      .query(`
        DELETE FROM HorariosRecepcion
        WHERE HorarioRecepcionID = @horarioID
      `)

    return NextResponse.json({ message: "Horario de recepción eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting recepción:", error)
    return NextResponse.json({ error: "Error al eliminar horario de recepción" }, { status: 500 })
  }
}
