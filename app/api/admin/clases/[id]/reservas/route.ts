import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"

// GET - Obtener todas las reservas de una clase
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] Obteniendo reservas de clase:", id)

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("claseId", id)
      .query(`
        SELECT 
          r.*,
          s.Nombre,
          s.Apellido,
          s.Email,
          s.Telefono,
          s.FotoURL,
          s.EstadoSocio,
          m.FechaInicio AS MembresiaInicio,
          m.FechaVencimiento AS MembresiaVencimiento,
          pm.NombrePlan
        FROM ReservasClases r
        INNER JOIN Socios s ON r.SocioID = s.SocioID
        LEFT JOIN Membresías m ON s.SocioID = m.SocioID AND m.Estado = 'Activa'
        LEFT JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
        WHERE r.ClaseID = @claseId
        ORDER BY r.FechaReserva DESC
      `)

    console.log("[v0] Reservas encontradas:", result.recordset.length)
    return NextResponse.json(result.recordset)
  } catch (error: any) {
    console.error("[v0] Error al obtener reservas:", error)
    return NextResponse.json({ error: "Error al obtener reservas", details: error.message }, { status: 500 })
  }
}

// POST - Crear una nueva reserva
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] === INICIO POST RESERVA ===")
    const { id } = await params
    console.log("[v0] ClaseID:", id)

    const body = await request.json()
    console.log("[v0] Body recibido:", body)

    const { socioId, fechaClase } = body

    if (!socioId || !fechaClase) {
      return NextResponse.json({ error: "Faltan datos requeridos: socioId y fechaClase" }, { status: 400 })
    }

    const pool = await getConnection()

    // 1) Validar membresía activa
    const membresiaResult = await pool
      .request()
      .input("socioId", socioId)
      .query(`
    SELECT 
      m.MembresíaID,
      m.Estado,
      m.FechaVencimiento,
      pm.NombrePlan
    FROM Membresías m
    INNER JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
    WHERE m.SocioID = @socioId
      AND m.Estado = 'Vigente'
      AND m.FechaVencimiento >= CAST(GETDATE() AS DATE)
  `)


    if (membresiaResult.recordset.length === 0) {
      // NOTIFICACIÓN (Admin + Socio)
      await crearNotificacion({
        tipoUsuario: "Admin",
        tipoEvento: "membresia_inactiva",
        titulo: "Inscripción rechazada (membresía inactiva)",
        mensaje: `Se rechazó inscripción: SocioID ${socioId} en ClaseID ${id} para ${fechaClase}.`,
      })

      await crearNotificacion({
        tipoUsuario: "Socio",
        usuarioID: socioId,
        tipoEvento: "membresia_inactiva",
        titulo: "Membresía inactiva",
        mensaje: `No puedes inscribirte a la clase porque tu membresía está vencida o inactiva.`,
      })

      return NextResponse.json(
        { error: "El socio no tiene una membresía activa o está vencida", code: "MEMBRESIA_INACTIVA" },
        { status: 400 },
      )
    }

    // 2) Verificar cupos
    const cupoResult = await pool
      .request()
      .input("claseId", id)
      .input("fechaClase", fechaClase)
      .query(`
        SELECT 
          c.CupoMaximo,
          (SELECT COUNT(*) FROM ReservasClases WHERE ClaseID = c.ClaseID AND Estado != 'Cancelada' AND FechaClase = @fechaClase) AS CuposOcupados
        FROM Clases c
        WHERE c.ClaseID = @claseId
      `)

    const { CupoMaximo, CuposOcupados } = cupoResult.recordset[0] ?? {}

    if (CupoMaximo == null) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })
    }

    if (CuposOcupados >= CupoMaximo) {
      // NOTIFICACIÓN (Admin)
      await crearNotificacion({
        tipoUsuario: "Admin",
        tipoEvento: "inscripcion_clase",
        titulo: "Inscripción rechazada (sin cupos)",
        mensaje: `Se rechazó inscripción: SocioID ${socioId} en ClaseID ${id} para ${fechaClase} (sin cupos).`,
      })

      return NextResponse.json({ error: "No hay cupos disponibles para esta clase", code: "SIN_CUPO" }, { status: 400 })
    }

    // 3) Verificar que no esté inscrito ya
    const existeReserva = await pool
      .request()
      .input("claseId", id)
      .input("socioId", socioId)
      .input("fechaClase", fechaClase)
      .query(`
        SELECT 1 as Existe
        FROM ReservasClases 
        WHERE ClaseID = @claseId AND SocioID = @socioId AND FechaClase = @fechaClase AND Estado != 'Cancelada'
      `)

    if (existeReserva.recordset.length > 0) {
      // NOTIFICACIÓN (Admin)
      await crearNotificacion({
        tipoUsuario: "Admin",
        tipoEvento: "inscripcion_clase",
        titulo: "Inscripción duplicada",
        mensaje: `SocioID ${socioId} ya estaba inscrito en ClaseID ${id} para ${fechaClase}.`,
      })

      return NextResponse.json(
        { error: "El socio ya está inscrito en esta clase para esta fecha", code: "DUPLICADA" },
        { status: 400 },
      )
    }

    // 4) Crear reserva
    const result = await pool
      .request()
      .input("claseId", id)
      .input("socioId", socioId)
      .input("fechaClase", fechaClase)
      .query(`
        INSERT INTO ReservasClases (ClaseID, SocioID, FechaClase, Estado)
        OUTPUT INSERTED.*
        VALUES (@claseId, @socioId, @fechaClase, 'Reservada')
      `)

    // NOTI EXITO
    await crearNotificacion({
      tipoUsuario: "Admin",
      tipoEvento: "inscripcion_clase",
      titulo: "Socio inscrito",
      mensaje: `Inscripción exitosa: SocioID ${socioId} en ClaseID ${id} para ${fechaClase}.`,
    })

    await crearNotificacion({
      tipoUsuario: "Socio",
      usuarioID: socioId,
      tipoEvento: "inscripcion_clase",
      titulo: "Inscripción confirmada",
      mensaje: `Tu inscripción a la clase fue registrada para la fecha ${fechaClase}.`,
    })

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error al crear reserva:", error)
    return NextResponse.json({ error: "Error al crear reserva", details: error.message }, { status: 500 })
  }
}

