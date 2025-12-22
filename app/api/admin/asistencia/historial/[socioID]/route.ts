import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ socioID: string }> }) {
  try {
    const { socioID } = await params
    const pool = await getConnection()

    const result = await pool
      .request()
      .input("SocioID", socioID)
      .query(`
        SELECT 
          AsistenciaID,
          SocioID,
          FechaHoraIngreso,
          FechaHoraSalida
        FROM Asistencias
        WHERE SocioID = @SocioID
          AND FechaHoraIngreso >= DATEADD(MONTH, -1, GETDATE())
        ORDER BY FechaHoraIngreso DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching historial:", error)
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 })
  }
}
