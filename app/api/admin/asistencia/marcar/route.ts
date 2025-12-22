import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { socioID, tipo } = await request.json()

    const pool = await getConnection()

    if (tipo === "entrada") {
      await pool
        .request()
        .input("SocioID", socioID)
        .query(`
          INSERT INTO Asistencias (SocioID, FechaHoraIngreso)
          VALUES (@SocioID, GETDATE())
        `)
    } else {
      // Registrar salida
      await pool
        .request()
        .input("SocioID", socioID)
        .query(`
          UPDATE Asistencias
          SET FechaHoraSalida = GETDATE()
          WHERE SocioID = @SocioID
            AND CAST(FechaHoraIngreso AS DATE) = CAST(GETDATE() AS DATE)
            AND FechaHoraSalida IS NULL
        `)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marcando asistencia:", error)
    return NextResponse.json({ error: "Error al marcar asistencia" }, { status: 500 })
  }
}
