import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"
import { crearNotificacion } from "@/lib/notifications"

export async function GET(request: Request, { params }: { params: Promise<{ claseID: string }> }) {
  try {
    const { claseID } = await params
    const url = new URL(request.url)
    const usuarioID = url.searchParams.get("usuarioID")

    if (!claseID || !usuarioID) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    const pool = await getConnection()
    const result = await pool
      .request()
      .input("ClaseID", sql.Int, claseID)
      .input("UsuarioID", sql.Int, usuarioID)
      .query(`
        SELECT 
            rc.*, 
            s.Nombre, s.Apellido, s.Email, s.FotoURL, s.EstadoSocio
        FROM ReservasClases rc
        INNER JOIN Socios s ON rc.SocioID = s.SocioID
        INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
        INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        WHERE rc.ClaseID = @ClaseID AND e.UsuarioID = @UsuarioID
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ claseID: string }> }) {
  try {
    const { claseID } = await params
    const { socioId, fechaClase } = await request.json()
    const url = new URL(request.url)
    const usuarioID = url.searchParams.get("usuarioID")

    if (!usuarioID) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const pool = await getConnection()

    const claseValidation = await pool
      .request()
      .input("ClaseID", sql.Int, claseID)
      .input("UsuarioID", sql.Int, usuarioID)
      .input("FechaClase", sql.Date, fechaClase)
      .query(`
        SELECT c.CupoMaximo, c.DiaSemana, c.FechaInicio, c.FechaFin,
               (SELECT COUNT(*) FROM ReservasClases 
                WHERE ClaseID = c.ClaseID 
                AND FechaClase = @FechaClase 
                AND Estado NOT IN ('Cancelada', 'NoAsistió')) as OcupadosEnFecha
        FROM Clases c
        INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        WHERE c.ClaseID = @ClaseID 
        AND e.UsuarioID = @UsuarioID
        AND c.Activa = 1
        AND (c.FechaFin IS NULL OR c.FechaFin >= @FechaClase)
        AND (c.FechaInicio IS NULL OR c.FechaInicio <= @FechaClase)
      `)

    if (claseValidation.recordset.length === 0) {
      return NextResponse.json(
        {
          error: "La clase no está disponible para esta fecha o ya expiró.",
        },
        { status: 403 },
      )
    }

    const { CupoMaximo, OcupadosEnFecha } = claseValidation.recordset[0]

    if (OcupadosEnFecha >= CupoMaximo) {
      return NextResponse.json(
        {
          error: "No hay cupos disponibles para esta fecha.",
        },
        { status: 400 },
      )
    }

    const duplicateCheck = await pool
      .request()
      .input("ClaseID", sql.Int, claseID)
      .input("SocioID", sql.Int, socioId)
      .input("FechaClase", sql.Date, fechaClase)
      .query(`
        SELECT ReservaID FROM ReservasClases
        WHERE ClaseID = @ClaseID 
        AND SocioID = @SocioID 
        AND FechaClase = @FechaClase
        AND Estado NOT IN ('Cancelada', 'NoAsistió')
      `)

    if (duplicateCheck.recordset.length > 0) {
      return NextResponse.json(
        {
          error: "Este socio ya está inscrito en esta clase para esta fecha.",
        },
        { status: 409 },
      )
    }

    const checkPlan = await pool
      .request()
      .input("SocioID", sql.Int, socioId)
      .query(`
        SELECT TOP 1 m.Estado, s.Nombre, s.Apellido 
        FROM Membresías m
        INNER JOIN Socios s ON m.SocioID = s.SocioID
        WHERE m.SocioID = @SocioID 
        AND m.Estado = 'Vigente' 
        AND m.FechaVencimiento >= GETDATE()
      `)

    if (checkPlan.recordset.length === 0) {
      return NextResponse.json(
        {
          error: "El socio no tiene una membresía vigente.",
        },
        { status: 403 },
      )
    }

    const socioNombre = `${checkPlan.recordset[0].Nombre} ${checkPlan.recordset[0].Apellido}`

    await pool
      .request()
      .input("ClaseID", sql.Int, claseID)
      .input("SocioID", sql.Int, socioId)
      .input("FechaClase", sql.Date, fechaClase)
      .query(`
        INSERT INTO ReservasClases (ClaseID, SocioID, FechaClase, Estado, FechaReserva)
        VALUES (@ClaseID, @SocioID, @FechaClase, 'Reservada', GETDATE())
      `)

    await crearNotificacion({
      tipoUsuario: "Entrenador",
      usuarioID: Number.parseInt(usuarioID),
      tipoEvento: "inscripcion_clase",
      titulo: "Nueva Inscripción",
      mensaje: `Inscribiste a ${socioNombre} para la clase del ${fechaClase}.`,
    })

    return NextResponse.json({ message: "Inscripción exitosa" })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      {
        error: error.message || "Error en el servidor al procesar la inscripción",
      },
      { status: 500 },
    )
  }
}
