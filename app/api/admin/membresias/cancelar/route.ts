import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, motivo } = body

    if (!socioID || !motivo) {
      return NextResponse.json({ error: "socioID y motivo son requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    // Permitir cancelar si está Vigente o Suspendida
    const target = await pool
      .request()
      .input("SocioID", socioID)
      .query(`
        SELECT TOP 1 MembresíaID, Estado
        FROM Membresías
        WHERE SocioID = @SocioID AND Estado IN ('Vigente', 'Suspendida')
        ORDER BY FechaCreacion DESC
      `)

    if (target.recordset.length === 0) {
      return NextResponse.json({ error: "No existe membresía vigente/suspendida para cancelar" }, { status: 409 })
    }

    const membresiaID = target.recordset[0].MembresíaID

    await pool
      .request()
      .input("MembresiaID", membresiaID)
      .input("Motivo", motivo)
      .query(`
        UPDATE Membresías
        SET Estado = 'Cancelada',
            MotivoEstado = @Motivo
        WHERE MembresíaID = @MembresiaID
      `)

    return NextResponse.json({ success: true, membresiaID })
  } catch (error) {
    console.error("Error al cancelar membresía:", error)
    return NextResponse.json({ error: "Error interno al cancelar membresía" }, { status: 500 })
  }
}
