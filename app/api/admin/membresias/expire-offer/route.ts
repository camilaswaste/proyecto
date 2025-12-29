import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import sql from "mssql"

export async function POST(request: Request) {
  try {
    const { planID } = await request.json()

    const pool = await getConnection()

    const planResult = await pool
      .request()
      .input("planID", sql.Int, planID)
      .query(`
        SELECT NombrePlan, Precio, Descuento 
        FROM PlanesMembresía 
        WHERE PlanID = @planID
      `)

    const plan = planResult.recordset[0]
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    // Calcular precio original
    const precioOriginal = Math.round(plan.Precio / (1 - plan.Descuento / 100))

    // Actualizar a plan normal
    await pool
      .request()
      .input("planID", sql.Int, planID)
      .input("precioOriginal", sql.Decimal(10, 2), precioOriginal)
      .query(`
        UPDATE PlanesMembresía
        SET TipoPlan = 'Normal',
            Precio = @precioOriginal,
            Descuento = 0,
            FechaInicioOferta = NULL,
            FechaFinOferta = NULL
        WHERE PlanID = @planID
      `)

    try {
      await crearNotificacion({
        tipoUsuario: "Admin",
        tipoEvento: "membresia_actualizada",
        titulo: "Oferta expirada",
        mensaje: `La oferta del plan "${plan.NombrePlan}" ha expirado y ha sido actualizado a plan normal con precio $${precioOriginal.toLocaleString()}.`,
      })
    } catch (notifError) {
      console.error("Error al crear notificación de oferta expirada:", notifError)
    }

    return NextResponse.json({ success: true, message: "Oferta expirada correctamente" })
  } catch (error) {
    console.error("Error al expirar oferta:", error)
    return NextResponse.json({ error: "Error al expirar oferta" }, { status: 500 })
  }
}
