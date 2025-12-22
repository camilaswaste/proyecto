import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import sql from "mssql"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        PlanID,
        NombrePlan,
        Descripcion,
        Precio,
        DuracionDias,
        TipoPlan,
        Descuento,
        FechaInicioOferta,
        FechaFinOferta,
        Beneficios,
        Activo,
        CASE 
          WHEN TipoPlan = 'Oferta' AND Descuento > 0 
          THEN ROUND(Precio / (1 - Descuento / 100.0), 0)
          ELSE Precio
        END AS PrecioOriginal
      FROM PlanesMembresía
      ORDER BY Precio ASC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener membresías:", error)
    return NextResponse.json({ error: "Error al obtener membresías" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nombrePlan,
      descripcion,
      precioOriginal,
      descuento,
      duracionDias,
      tipoPlan,
      fechaInicioOferta,
      fechaFinOferta,
      beneficios,
    } = body

    const pool = await getConnection()

    let precioFinal = Number(precioOriginal)
    if (tipoPlan === "Oferta" && descuento) {
      precioFinal = Math.round(precioFinal * (1 - Number(descuento) / 100))
    }

    await pool
      .request()
      .input("nombrePlan", nombrePlan)
      .input("descripcion", descripcion)
      .input("precio", precioFinal)
      .input("duracionDias", duracionDias)
      .input("tipoPlan", tipoPlan)
      .input("descuento", tipoPlan === "Oferta" ? Number(descuento) : 0)
      .input("fechaInicioOferta", tipoPlan === "Oferta" ? fechaInicioOferta : null)
      .input("fechaFinOferta", tipoPlan === "Oferta" ? fechaFinOferta : null)
      .input("beneficios", beneficios)
      .input("activo", true)
      .query(`
        INSERT INTO PlanesMembresía (
          NombrePlan, Descripcion, Precio, DuracionDias, TipoPlan, 
          Descuento, FechaInicioOferta, FechaFinOferta, Beneficios, Activo
        )
        VALUES (
          @nombrePlan, @descripcion, @precio, @duracionDias, @tipoPlan,
          @descuento, @fechaInicioOferta, @fechaFinOferta, @beneficios, @activo
        )
      `)

    return NextResponse.json({ success: true, message: "Plan creado exitosamente" })
  } catch (error) {
    console.error("Error al crear plan:", error)
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const pool = await getConnection()

    // CASO 1: ASIGNACIÓN DE MEMBRESÍA
    if (body.pagoID && body.socioID) {
      const { socioID, planID, pagoID } = body

      const planResult = await pool
        .request()
        .input("planID", sql.Int, planID)
        .query(`SELECT DuracionDias, NombrePlan FROM PlanesMembresía WHERE PlanID = @planID`)

      const plan = planResult.recordset[0]
      if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

      await pool
        .request()
        .input("socioID", socioID)
        .query(`UPDATE Membresías SET Estado = 'Vencida' WHERE SocioID = @socioID AND Estado = 'Vigente'`)

      const fechaInicio = new Date()
      const fechaFin = new Date()
      fechaFin.setDate(fechaFin.getDate() + plan.DuracionDias)

      const montoResult = await pool
        .request()
        .input("pagoID", pagoID)
        .query(`SELECT MontoPago FROM Pagos WHERE PagoID = @pagoID`)
      const montoPagado = montoResult.recordset[0]?.MontoPago || 0

      await pool
        .request()
        .input("socioID", socioID)
        .input("planID", planID)
        .input("fechaInicio", fechaInicio)
        .input("fechaFin", fechaFin)
        .input("montoPagado", montoPagado)
        .query(`
          INSERT INTO Membresías (SocioID, PlanID, FechaInicio, FechaVencimiento, Estado, MontoPagado)
          VALUES (@socioID, @planID, @fechaInicio, @fechaFin, 'Vigente', @montoPagado)
        `)

      await pool
        .request()
        .input("socioID", socioID)
        .query(`UPDATE Socios SET EstadoSocio = 'Activo' WHERE SocioID = @socioID AND EstadoSocio = 'Inactivo'`)

      await pool
        .request()
        .input("pagoID", pagoID)
        .query(`UPDATE Pagos SET Concepto = REPLACE(Concepto, ' - PENDIENTE DE ASIGNACIÓN', '') WHERE PagoID = @pagoID`)

      try {
        await crearNotificacion({
          tipoUsuario: "Socio",
          usuarioID: socioID,
          tipoEvento: "membresia_asignada",
          titulo: "Membresía activada",
          mensaje: `Tu membresía ${plan.NombrePlan} ha sido activada exitosamente. Vence el ${fechaFin.toLocaleDateString("es-CL")}.`,
        })
      } catch (error) {
        console.error("Error al crear notificación de membresía:", error)
      }

      return NextResponse.json({ success: true, message: "Membresía asignada y activada exitosamente" })
    }
    // CASO 2: ACTUALIZAR PLAN
    else {
      const {
        planID,
        nombrePlan,
        descripcion,
        precioOriginal,
        descuento,
        duracionDias,
        tipoPlan,
        fechaInicioOferta,
        fechaFinOferta,
        beneficios,
        activo,
      } = body

      let precioFinal = Number(precioOriginal)
      if (tipoPlan === "Oferta" && descuento) {
        precioFinal = Math.round(precioFinal * (1 - Number(descuento) / 100))
      }

      await pool
        .request()
        .input("planID", planID)
        .input("nombrePlan", nombrePlan)
        .input("descripcion", descripcion)
        .input("precio", precioFinal)
        .input("duracionDias", duracionDias)
        .input("tipoPlan", tipoPlan)
        .input("descuento", tipoPlan === "Oferta" ? Number(descuento) || 0 : 0)
        .input("fechaInicioOferta", tipoPlan === "Oferta" ? fechaInicioOferta : null)
        .input("fechaFinOferta", tipoPlan === "Oferta" ? fechaFinOferta : null)
        .input("beneficios", beneficios)
        .input("activo", activo)
        .query(`
          UPDATE PlanesMembresía
          SET NombrePlan = @nombrePlan, 
              Descripcion = @descripcion, 
              Precio = @precio,
              DuracionDias = @duracionDias, 
              TipoPlan = @tipoPlan, 
              Descuento = @descuento,
              FechaInicioOferta = @fechaInicioOferta,
              FechaFinOferta = @fechaFinOferta,
              Beneficios = @beneficios, 
              Activo = @activo
          WHERE PlanID = @planID
        `)

      return NextResponse.json({ success: true, message: "Plan actualizado exitosamente" })
    }
  } catch (error) {
    console.error("Error en PUT membresías/planes:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const planID = searchParams.get("planID")

    if (!planID) {
      return NextResponse.json({ error: "PlanID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("planID", planID)
      .query(`
        UPDATE PlanesMembresía
        SET Activo = 0
        WHERE PlanID = @planID
      `)

    return NextResponse.json({ success: true, message: "Plan eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar plan:", error)
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 })
  }
}
