import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import sql from "mssql"
import { NextResponse } from "next/server"

async function registrarAuditoria(
  pool: any,
  planID: number | null,
  nombrePlan: string,
  tipoAccion: "CREAR" | "MODIFICAR" | "ACTIVAR" | "DESACTIVAR",
  camposModificados: string[] = [],
  valoresAnteriores: any = {},
  valoresNuevos: any = {},
  descripcion = "",
) {
  try {
    await pool
      .request()
      .input("planID", planID)
      .input("nombrePlan", nombrePlan)
      .input("tipoAccion", tipoAccion)
      .input("camposModificados", camposModificados.length > 0 ? JSON.stringify(camposModificados) : null)
      .input("valoresAnteriores", Object.keys(valoresAnteriores).length > 0 ? JSON.stringify(valoresAnteriores) : null)
      .input("valoresNuevos", Object.keys(valoresNuevos).length > 0 ? JSON.stringify(valoresNuevos) : null)
      .input("descripcion", descripcion)
      .query(`
        INSERT INTO AuditoriaMembresías (PlanID, NombrePlan, TipoAccion, CamposModificados, ValoresAnteriores, ValoresNuevos, Descripcion)
        VALUES (@planID, @nombrePlan, @tipoAccion, @camposModificados, @valoresAnteriores, @valoresNuevos, @descripcion)
      `)
  } catch (error) {
    console.error("Error al registrar auditoría:", error)
  }
}

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

    console.log("[v0] Creando plan con TipoPlan:", tipoPlan)

    const pool = await getConnection()

    let precioFinal = Number(precioOriginal)
    if (tipoPlan === "Oferta" && descuento) {
      precioFinal = Math.round(precioFinal * (1 - Number(descuento) / 100))
    }

    const result = await pool
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
        OUTPUT INSERTED.PlanID
        VALUES (
          @nombrePlan, @descripcion, @precio, @duracionDias, @tipoPlan,
          @descuento, @fechaInicioOferta, @fechaFinOferta, @beneficios, @activo
        )
      `)

    const planID = result.recordset[0]?.PlanID
    const valoresNuevos: any = {
      nombrePlan,
      descripcion,
      precio: `$${precioFinal.toLocaleString()}`,
      duracionDias: `${duracionDias} días`,
      tipoPlan,
      beneficios,
      activo: true,
    }

    if (tipoPlan === "Oferta") {
      console.log("[v0] Plan tipo Oferta detectado, preparando notificación...")
      valoresNuevos.precioOriginal = `$${Number(precioOriginal).toLocaleString()}`
      valoresNuevos.descuento = `${descuento}%`
      valoresNuevos.fechaInicioOferta = fechaInicioOferta
      valoresNuevos.fechaFinOferta = fechaFinOferta

      try {
        const fechaFin = new Date(fechaFinOferta)
        console.log("[v0] Llamando a crearNotificacion para plan promocional:", nombrePlan)

        await crearNotificacion({
          tipoUsuario: "Socio",
          tipoEvento: "plan_promocional",
          titulo: `Nueva Oferta: ${nombrePlan}`,
          mensaje: `Tenemos una nueva oferta especial: ${nombrePlan} con ${descuento}% de descuento. Precio: $${precioFinal.toLocaleString()} (antes $${Number(precioOriginal).toLocaleString()}). Válida hasta el ${fechaFin.toLocaleDateString("es-CL")}.`,
        })

        console.log("[v0] Notificación de plan promocional enviada exitosamente")
      } catch (notifError) {
        console.error("[v0] ERROR al notificar plan promocional:", notifError)
      }
    }

    await registrarAuditoria(
      pool,
      planID,
      nombrePlan,
      "CREAR",
      [],
      {},
      valoresNuevos,
      `Plan "${nombrePlan}" creado con precio $${precioFinal.toLocaleString()} y duración de ${duracionDias} días${tipoPlan === "Oferta" ? ` (Oferta con ${descuento}% descuento)` : ""}`,
    )

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

      const currentPlanResult = await pool
        .request()
        .input("planID", planID)
        .query(`SELECT * FROM PlanesMembresía WHERE PlanID = @planID`)

      const currentPlan = currentPlanResult.recordset[0]
      if (!currentPlan) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
      }

      let precioFinal = Number(precioOriginal)
      if (tipoPlan === "Oferta" && descuento) {
        precioFinal = Math.round(precioFinal * (1 - Number(descuento) / 100))
      }

      const camposModificados: string[] = []
      const valoresAnteriores: any = {}
      const valoresNuevos: any = {}

      if (currentPlan.NombrePlan !== nombrePlan) {
        camposModificados.push("Nombre del Plan")
        valoresAnteriores["Nombre del Plan"] = currentPlan.NombrePlan
        valoresNuevos["Nombre del Plan"] = nombrePlan
      }
      if (currentPlan.Descripcion !== descripcion) {
        camposModificados.push("Descripción")
        valoresAnteriores["Descripción"] = currentPlan.Descripcion || ""
        valoresNuevos["Descripción"] = descripcion
      }
      if (Number(currentPlan.Precio) !== precioFinal) {
        camposModificados.push("Precio")
        valoresAnteriores["Precio"] = `$${Number(currentPlan.Precio).toLocaleString()}`
        valoresNuevos["Precio"] = `$${precioFinal.toLocaleString()}`
      }
      if (Number(currentPlan.DuracionDias) !== Number(duracionDias)) {
        camposModificados.push("Duración")
        valoresAnteriores["Duración"] = `${currentPlan.DuracionDias} días`
        valoresNuevos["Duración"] = `${duracionDias} días`
      }
      if (currentPlan.TipoPlan !== tipoPlan) {
        camposModificados.push("Tipo de Plan")
        valoresAnteriores["Tipo de Plan"] = currentPlan.TipoPlan
        valoresNuevos["Tipo de Plan"] = tipoPlan
      }

      const convirtioAOferta = currentPlan.TipoPlan === "Normal" && tipoPlan === "Oferta"

      if (tipoPlan === "Oferta") {
        if (Number(currentPlan.Descuento) !== Number(descuento)) {
          camposModificados.push("Descuento")
          valoresAnteriores["Descuento"] = `${currentPlan.Descuento || 0}%`
          valoresNuevos["Descuento"] = `${descuento}%`
        }
        if (currentPlan.FechaInicioOferta !== fechaInicioOferta) {
          camposModificados.push("Fecha Inicio Oferta")
          valoresAnteriores["Fecha Inicio Oferta"] = currentPlan.FechaInicioOferta || ""
          valoresNuevos["Fecha Inicio Oferta"] = fechaInicioOferta
        }
        if (currentPlan.FechaFinOferta !== fechaFinOferta) {
          camposModificados.push("Fecha Fin Oferta")
          valoresAnteriores["Fecha Fin Oferta"] = currentPlan.FechaFinOferta || ""
          valoresNuevos["Fecha Fin Oferta"] = fechaFinOferta
        }
      }
      if (currentPlan.Beneficios !== beneficios) {
        camposModificados.push("Beneficios")
        valoresAnteriores["Beneficios"] = currentPlan.Beneficios || ""
        valoresNuevos["Beneficios"] = beneficios
      }

      let tipoAccion: "MODIFICAR" | "ACTIVAR" | "DESACTIVAR" = "MODIFICAR"
      let descripcionAuditoria = ""

      if (currentPlan.Activo !== activo) {
        if (activo) {
          tipoAccion = "ACTIVAR"
          descripcionAuditoria = `Plan "${nombrePlan}" reactivado y disponible para asignación`
        } else {
          tipoAccion = "DESACTIVAR"
          descripcionAuditoria = `Plan "${nombrePlan}" desactivado. Ya no está disponible para nuevas asignaciones, pero las membresías vigentes continúan activas`
        }
      } else if (camposModificados.length > 0) {
        descripcionAuditoria = `Plan "${nombrePlan}" modificado: ${camposModificados.join(", ")}`
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

      if (convirtioAOferta && activo) {
        console.log("[v0] Plan convertido a Oferta, preparando notificación...")
        try {
          const fechaFin = new Date(fechaFinOferta)
          console.log("[v0] Llamando a crearNotificacion para plan actualizado a oferta:", nombrePlan)

          await crearNotificacion({
            tipoUsuario: "Socio",
            tipoEvento: "plan_promocional",
            titulo: `¡Nueva Oferta! ${nombrePlan}`,
            mensaje: `Tenemos una nueva oferta especial: ${nombrePlan} con ${descuento}% de descuento. Precio: $${precioFinal.toLocaleString()} (antes $${Number(precioOriginal).toLocaleString()}). Válida hasta el ${fechaFin.toLocaleDateString("es-CL")}.`,
          })

          console.log("[v0] Notificación de plan promocional actualizado enviada exitosamente")
        } catch (notifError) {
          console.error("[v0] ERROR al notificar plan promocional actualizado:", notifError)
        }
      }

      if (currentPlan.Activo !== activo || camposModificados.length > 0) {
        await registrarAuditoria(
          pool,
          planID,
          nombrePlan,
          tipoAccion,
          camposModificados,
          valoresAnteriores,
          valoresNuevos,
          descripcionAuditoria,
        )
      }

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

    const planResult = await pool
      .request()
      .input("planID", planID)
      .query(`SELECT NombrePlan FROM PlanesMembresía WHERE PlanID = @planID`)

    const nombrePlan = planResult.recordset[0]?.NombrePlan || "Plan desconocido"

    await pool
      .request()
      .input("planID", planID)
      .query(`
        UPDATE PlanesMembresía
        SET Activo = 0
        WHERE PlanID = @planID
      `)

    await registrarAuditoria(
      pool,
      Number(planID),
      nombrePlan,
      "DESACTIVAR",
      [],
      {},
      {},
      `Plan "${nombrePlan}" eliminado (desactivado). Las membresías vigentes permanecen activas hasta su vencimiento`,
    )

    return NextResponse.json({ success: true, message: "Plan eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar plan:", error)
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 })
  }
}
