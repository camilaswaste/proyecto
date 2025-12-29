//api/pagos/route.ts
import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        c.PagoID,
        c.SocioID,
        c.NumeroComprobante,
        c.MontoPago as Monto,
        c.MedioPago as MetodoPago,
        c.FechaEmision as FechaPago,
        c.Concepto,
        c.Estado,
        c.NombrePlan,
        c.NombreSocio
      FROM Comprobantes c
      ORDER BY c.FechaEmision DESC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error al obtener comprobantes:", errorMessage)
    return NextResponse.json({ error: "Error al obtener comprobantes: " + errorMessage }, { status: 500 })
  }
}