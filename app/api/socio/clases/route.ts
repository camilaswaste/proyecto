import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

// Get available classes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const socioID = searchParams.get("socioID")

    const pool = await getConnection()

    // Get all active classes with trainer info and current reservations count
    const result = await pool.request().query(`
      SELECT 
        c.ClaseID,
        c.NombreClase,
        c.Descripcion,
        c.DiaSemana,
        c.HoraInicio,
        c.HoraFin,
        c.CupoMaximo,
        u.Nombre + ' ' + u.Apellido as NombreEntrenador,
        e.Especialidad,
        (SELECT COUNT(*) FROM ReservasClases rc 
         WHERE rc.ClaseID = c.ClaseID 
         AND rc.FechaClase >= CAST(GETDATE() AS DATE)
         AND rc.Estado = 'Reservada') as ReservasActuales
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

    // If socioID provided, also get their reservations
    let reservations = []
    if (socioID) {
      const reservasResult = await pool
        .request()
        .input("socioID", socioID)
        .query(`
          SELECT ClaseID, FechaClase, Estado
          FROM ReservasClases
          WHERE SocioID = @socioID
          AND FechaClase >= CAST(GETDATE() AS DATE)
          AND Estado IN ('Reservada', 'Asistió')
        `)
      reservations = reservasResult.recordset
    }

    return NextResponse.json({
      clases: result.recordset,
      reservaciones: reservations,
    })
  } catch (error) {
    console.error("Error al obtener clases:", error)
    return NextResponse.json({ error: "Error al obtener clases" }, { status: 500 })
  }
}

// Book a class
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, claseID, fechaClase } = body

    if (!socioID || !claseID || !fechaClase) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    // Check if class exists and is active
    const claseResult = await pool
      .request()
      .input("claseID", claseID)
      .query(`
        SELECT CupoMaximo, Activa
        FROM Clases
        WHERE ClaseID = @claseID
      `)

    if (claseResult.recordset.length === 0 || !claseResult.recordset[0].Activa) {
      return NextResponse.json({ error: "Clase no disponible" }, { status: 400 })
    }

    const cupoMaximo = claseResult.recordset[0].CupoMaximo

    // Check if socio already has a reservation for this class on this date
    const existingReservation = await pool
      .request()
      .input("socioID", socioID)
      .input("claseID", claseID)
      .input("fechaClase", fechaClase)
      .query(`
        SELECT COUNT(*) as Count
        FROM ReservasClases
        WHERE SocioID = @socioID
        AND ClaseID = @claseID
        AND FechaClase = @fechaClase
        AND Estado IN ('Reservada', 'Asistió')
      `)

    if (existingReservation.recordset[0].Count > 0) {
      return NextResponse.json({ error: "Ya tienes una reserva para esta clase en esta fecha" }, { status: 400 })
    }

    // Check if class is full
    const reservasCount = await pool
      .request()
      .input("claseID", claseID)
      .input("fechaClase", fechaClase)
      .query(`
        SELECT COUNT(*) as Count
        FROM ReservasClases
        WHERE ClaseID = @claseID
        AND FechaClase = @fechaClase
        AND Estado = 'Reservada'
      `)

    if (reservasCount.recordset[0].Count >= cupoMaximo) {
      return NextResponse.json({ error: "La clase está llena" }, { status: 400 })
    }

    // Create reservation
    await pool
      .request()
      .input("socioID", socioID)
      .input("claseID", claseID)
      .input("fechaClase", fechaClase)
      .query(`
        INSERT INTO ReservasClases (SocioID, ClaseID, FechaClase, Estado)
        VALUES (@socioID, @claseID, @fechaClase, 'Reservada')
      `)

    return NextResponse.json({ message: "Clase reservada exitosamente" }, { status: 201 })
  } catch (error) {
    console.error("Error al reservar clase:", error)
    return NextResponse.json({ error: "Error al reservar clase" }, { status: 500 })
  }
}

// Cancel a class reservation
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reservaID = searchParams.get("reservaID")

    if (!reservaID) {
      return NextResponse.json({ error: "ReservaID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("reservaID", reservaID)
      .query(`
        UPDATE ReservasClases
        SET Estado = 'Cancelada'
        WHERE ReservaID = @reservaID
      `)

    return NextResponse.json({ message: "Reserva cancelada exitosamente" })
  } catch (error) {
    console.error("Error al cancelar reserva:", error)
    return NextResponse.json({ error: "Error al cancelar reserva" }, { status: 500 })
  }
}
