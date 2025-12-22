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
          m.MembresíaID, 
          m.FechaInicio,
          m.FechaVencimiento AS FechaFin, 
          m.Estado as Estado, 
          p.NombrePlan,
          p.Descripcion,
          p.Precio,
          p.DuracionDias,
          p.Beneficios,
          s.CodigoQR,
          s.Nombre,
          s.Apellido,
          s.RUT,
          s.Email,
          s.FotoURL
        FROM Membresías m 
        INNER JOIN PlanesMembresía p ON m.PlanID = p.PlanID
        INNER JOIN Socios s ON m.SocioID = s.SocioID
        WHERE m.SocioID = @socioID
        ORDER BY m.FechaInicio DESC
      `)

    return NextResponse.json(result.recordset[0] || null)
  } catch (error) {
    console.error("Error al obtener membresía del socio:", error)
    return NextResponse.json({ error: "Error al obtener membresía" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, planID } = body

    if (!socioID || !planID) {
      return NextResponse.json({ error: "SocioID y PlanID son requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    // 1. Obtener detalles del plan (Para saber cuánto cobrar)
    const planResult = await pool
      .request()
      .input("planID", planID)
      .query(`
        SELECT NombrePlan, Precio
        FROM PlanesMembresía
        WHERE PlanID = @planID AND Activo = 1
      `)

    if (planResult.recordset.length === 0) {
      return NextResponse.json({ error: "Plan no encontrado o inactivo" }, { status: 404 })
    }

    const plan = planResult.recordset[0]

    // 2. Registrar el Pago (INSERT con OUTPUT para obtener el ID)
    const pagoResult = await pool
      .request()
      .input("socioID", socioID)
      .input("monto", plan.Precio)
      .input("metodoPago", "Efectivo")
      .input("concepto", `Pago de Membresía: ${plan.NombrePlan} - PENDIENTE DE ASIGNACIÓN`)
      .query(`
        INSERT INTO Pagos (SocioID, FechaPago, MontoPago, MedioPago, Concepto) 
        OUTPUT INSERTED.PagoID 
        VALUES (@socioID, GETDATE(), @monto, @metodoPago, @concepto)
      `)

    const newPagoID = pagoResult.recordset[0]?.PagoID

    // 3. Retornar éxito con los datos necesarios para la redirección
    return NextResponse.json({
      success: true,
      message: "Pago registrado. Redirigiendo a comprobante para asignación final.",
      pagoID: newPagoID,
      planID: planID,
      socioID: socioID,
    })
  } catch (error) {
    console.error("Error al registrar pago:", error)
    return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 })
  }
}
