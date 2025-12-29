//api/pagos/obtener/route.ts
import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "PagoID es requerido" }, { status: 400 })
    }

    const pagoID = Number.parseInt(id, 10)
    if (Number.isNaN(pagoID)) {
      return NextResponse.json({ error: "PagoID inválido" }, { status: 400 })
    }

    const pool = await getConnection()

    // ✅ FUENTE DE LA VERDAD: Pagos
    // Traemos socio, y si el pago ya tiene MembresíaID, traemos Plan y Fechas.
    const result = await pool
      .request()
      .input("pagoID", pagoID)
      .query(`
        SELECT
          p.PagoID,
          p.NumeroComprobante,
          p.FechaPago,
          p.MontoPago AS Monto,
          p.MedioPago AS MetodoPago,
          p.Concepto,
          p.ComprobantePath,

          s.Nombre,
          s.Apellido,
          s.RUT,

          m.MembresíaID,
          m.FechaInicio,
          m.FechaVencimiento,

          pm.NombrePlan,
          pm.DuracionDias
        FROM Pagos p
        INNER JOIN Socios s ON p.SocioID = s.SocioID
        LEFT JOIN Membresías m ON p.MembresíaID = m.MembresíaID
        LEFT JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
        WHERE p.PagoID = @pagoID;
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    const data = result.recordset[0]

    // ✅ Respuesta EXACTA que espera tu page.tsx
    return NextResponse.json({
      PagoID: data.PagoID,
      NumeroComprobante: data.NumeroComprobante,
      FechaPago: data.FechaPago,
      Monto: data.Monto,
      MetodoPago: data.MetodoPago,
      Nombre: data.Nombre,
      Apellido: data.Apellido,
      RUT: data.RUT,

      // Plan / vigencia (si existe membresía asociada al pago)
      NombrePlan: data.NombrePlan || "Plan no asociado",
      DuracionDias: data.DuracionDias || 0,
      FechaInicio: data.FechaInicio,
      FechaVencimiento: data.FechaVencimiento,

      Concepto: data.Concepto,

      // ✅ Esto te sirve para botón "Descargar PDF" desde S3
      ComprobantePath: data.ComprobantePath || null,
    })
  } catch (error) {
    console.error("[API] Error al obtener comprobante:", error)
    return NextResponse.json(
      { error: "Error interno del servidor al obtener el comprobante" },
      { status: 500 }
    )
  }
}