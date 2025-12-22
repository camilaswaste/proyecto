//api/pagos/comprobante/route.ts
import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

/**
 * GET /api/pagos/comprobante?pagoID=123
 *
 * Obtiene los detalles completos del pago para mostrar el comprobante
 * Incluye: datos del socio, plan, pago y membresía
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pagoID = searchParams.get("pagoID")

    if (!pagoID) {
      return NextResponse.json({ error: "pagoID requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("pagoID", pagoID)
      .query(`
        SELECT 
          p.PagoID,
          p.FechaPago,
          p.Monto,
          p.MetodoPago,
          p.ReferenciaPago,
          p.Estado AS EstadoPago,
          p.Concepto,
          s.SocioID,
          s.Nombre AS SocioNombre,
          s.Apellido AS SocioApellido,
          s.RUT AS SocioRUT,
          s.Email AS SocioEmail,
          pl.NombrePlan,
          pl.DuracionDias,
          pl.Descripcion,
          m.MembresíaID,
          m.FechaInicio,
          m.FechaFin,
          m.Estado AS EstadoMembresia
        FROM Pagos p
        INNER JOIN Socios s ON p.SocioID = s.SocioID
        LEFT JOIN Membresías m ON p.MembresíaID = m.MembresíaID
        LEFT JOIN PlanesMembresía pl ON m.PlanID = pl.PlanID
        WHERE p.PagoID = @pagoID
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error al obtener comprobante:", error)
    return NextResponse.json({ error: "Error al obtener el comprobante" }, { status: 500 })
  }
}