import { getConnection } from "@/lib/db"
import sql from "mssql"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ socioId: string }> }) {
  try {
    const { socioId } = await params
    const socioID = Number.parseInt(socioId)

    if (isNaN(socioID)) {
      return NextResponse.json({ error: "ID de socio inválido" }, { status: 400 })
    }

    const pool = await getConnection()

    // Obtener información del socio
    const socioResult = await pool
      .request()
      .input("socioID", sql.Int, socioID)
      .query(`
      SELECT Nombre, Apellido, Email, RUT
      FROM Socios
      WHERE SocioID = @socioID
    `)

    if (socioResult.recordset.length === 0) {
      return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 })
    }

    const socio = socioResult.recordset[0]

    // Obtener historial completo
    const historialResult = await pool
      .request()
      .input("socioID", sql.Int, socioID)
      .query(`
      SELECT 
        HistorialID,
        MembresíaID,
        Accion,
        PlanAnterior,
        PlanNuevo,
        EstadoAnterior,
        EstadoNuevo,
        FechaAnterior,
        FechaNueva,
        MontoAnterior,
        MontoNuevo,
        Motivo,
        Detalles,
        FechaRegistro,
        AdminUsuario
      FROM HistorialMembresiasSocios
      WHERE SocioID = @socioID
      ORDER BY FechaRegistro DESC
    `)

    return NextResponse.json({
      socio,
      historial: historialResult.recordset,
    })
  } catch (error) {
    console.error("Error al obtener historial del socio:", error)
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 })
  }
}
