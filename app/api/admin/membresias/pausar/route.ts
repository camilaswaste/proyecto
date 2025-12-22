import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, dias, motivo } = body

    if (!socioID || !dias || Number(dias) <= 0) {
      return NextResponse.json({ error: "Datos inválidos (socioID y dias > 0)" }, { status: 400 })
    }

    const pool = await getConnection()

    // Buscar membresía vigente
    const vigente = await pool
      .request()
      .input("SocioID", socioID)
      .query(`
        SELECT TOP 1 MembresíaID
        FROM Membresías
        WHERE SocioID = @SocioID AND Estado = 'Vigente'
        ORDER BY FechaCreacion DESC
      `)

    if (vigente.recordset.length === 0) {
      return NextResponse.json({ error: "No existe membresía vigente para pausar" }, { status: 409 })
    }

    const membresiaID = vigente.recordset[0].MembresíaID

    await pool
      .request()
      .input("MembresiaID", membresiaID)
      .input("Dias", Number(dias))
      .input("Motivo", motivo || null)
      .query(`
        UPDATE Membresías
        SET Estado = 'Suspendida',
            FechaSuspension = CAST(GETDATE() AS DATE),
            DiasSuspension = @Dias,
            MotivoEstado = @Motivo
        WHERE MembresíaID = @MembresiaID
      `)

    return NextResponse.json({ success: true, membresiaID })
  } catch (error) {
    console.error("Error al pausar membresía:", error)
    return NextResponse.json({ error: "Error interno al pausar membresía" }, { status: 500 })
  }
}
