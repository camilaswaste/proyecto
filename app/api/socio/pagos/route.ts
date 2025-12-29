import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const socioID = searchParams.get("socioID")

    if (!socioID) {
      return NextResponse.json({ error: "SocioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("socioID", socioID)
      .query(`
        SELECT 
          p.PagoID,
          p.NumeroComprobante,
          p.MontoPago AS Monto,
          p.FechaPago,
          p.MedioPago AS MetodoPago,
          p.Concepto,
          p.ComprobantePath,
          pl.NombrePlan,
          s.Nombre,
          s.Apellido
        FROM Pagos p
        INNER JOIN Socios s ON p.SocioID = s.SocioID
        LEFT JOIN Membresías m ON p.MembresíaID = m.MembresíaID
        LEFT JOIN PlanesMembresía pl ON m.PlanID = pl.PlanID
        WHERE p.SocioID = @socioID
        ORDER BY p.FechaPago DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener pagos del socio:", error)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}
