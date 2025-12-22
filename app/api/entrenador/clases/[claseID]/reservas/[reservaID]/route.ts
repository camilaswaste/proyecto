// /api/entrenador/clases/[claseID]/reservas/route.ts
import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"

// --- GET: Obtener reservas (Ya lo tenías, mantenemos la lógica) ---
export async function GET(request: Request, { params }: { params: { claseID: string } }) {
  // ... (Tu código actual de GET está perfecto)
}

// --- POST: Inscribir Socio ---
export async function POST(request: Request, { params }: { params: { claseID: string } }) {
  try {
    const { socioId, fechaClase } = await request.json()
    const url = new URL(request.url)
    const usuarioID = url.searchParams.get("usuarioID")
    const claseID = params.claseID

    const pool = await getConnection()

    // 1. Validar propiedad de la clase por el entrenador
    const validation = await pool.request()
      .input("ClaseID", sql.Int, claseID)
      .input("UsuarioID", sql.Int, usuarioID)
      .query(`
        SELECT c.CupoMaximo, (SELECT COUNT(*) FROM ReservasClases WHERE ClaseID = c.ClaseID AND Estado != 'Cancelada') as Ocupados
        FROM Clases c
        INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        WHERE c.ClaseID = @ClaseID AND e.UsuarioID = @UsuarioID
      `)

    if (validation.recordset.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { CupoMaximo, Ocupados } = validation.recordset[0]
    if (Ocupados >= CupoMaximo) {
      return NextResponse.json({ error: "La clase está llena" }, { status: 400 })
    }

    // 2. Insertar Reserva
    await pool.request()
      .input("ClaseID", sql.Int, claseID)
      .input("SocioID", sql.Int, socioId)
      .input("FechaClase", sql.Date, fechaClase)
      .query(`
        INSERT INTO ReservasClases (ClaseID, SocioID, FechaClase, Estado, FechaReserva)
        VALUES (@ClaseID, @SocioID, @FechaClase, 'Reservada', GETDATE())
      `)

    return NextResponse.json({ message: "Inscripción exitosa" })
  } catch (error) {
    return NextResponse.json({ error: "Error al inscribir" }, { status: 500 })
  }
}