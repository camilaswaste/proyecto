import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, extenderVencimiento = true } = body

    if (!socioID) {
      return NextResponse.json({ error: "socioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    // 1) Buscar membresía suspendida más reciente
    const sus = await pool.request().input("SocioID", socioID).query(`
      SELECT TOP 1 MembresíaID, FechaVencimiento, DiasSuspension
      FROM Membresías
      WHERE SocioID = @SocioID AND Estado = 'Suspendida'
      ORDER BY FechaCreacion DESC
    `)

    if (sus.recordset.length === 0) {
      return NextResponse.json({ error: "No hay membresía suspendida para reanudar" }, { status: 409 })
    }

    const { MembresíaID, DiasSuspension } = sus.recordset[0]
    const dias = Number(DiasSuspension || 0)

    // 2) Reanudar (y opcionalmente extender vencimiento)
    // - Si extenderVencimiento = true, sumamos DiasSuspension a FechaVencimiento
    // - Siempre dejamos Estado = Vigente
    await pool
      .request()
      .input("MembresiaID", MembresíaID)
      .input("Dias", dias)
      .input("Extender", extenderVencimiento ? 1 : 0)
      .query(`
        UPDATE Membresías
        SET Estado = 'Vigente',
            FechaVencimiento = CASE
              WHEN @Extender = 1 AND @Dias > 0
                THEN DATEADD(day, @Dias, FechaVencimiento)
              ELSE FechaVencimiento
            END,
            DiasSuspension = NULL,
            FechaSuspension = NULL
        WHERE MembresíaID = @MembresiaID
      `)

    return NextResponse.json({ success: true, membresiaID: MembresíaID, extendido: extenderVencimiento })
  } catch (err) {
    console.error("Error al reanudar membresía:", err)
    return NextResponse.json({ error: "Error interno al reanudar membresía" }, { status: 500 })
  }
}