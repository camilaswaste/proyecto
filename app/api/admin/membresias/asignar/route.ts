import { getConnection } from "@/lib/db"
import sql from "mssql"
import { NextResponse } from "next/server"

async function registrarHistorialMembresia(
  pool: any,
  socioID: number,
  membresiaID: number | null,
  accion: string,
  detalles: any,
) {
  try {
    await pool
      .request()
      .input("SocioID", sql.Int, socioID)
      .input("MembresiaID", sql.Int, membresiaID)
      .input("Accion", sql.NVarChar, accion)
      .input("PlanAnterior", sql.NVarChar, detalles.planAnterior || null)
      .input("PlanNuevo", sql.NVarChar, detalles.planNuevo || null)
      .input("EstadoAnterior", sql.NVarChar, detalles.estadoAnterior || null)
      .input("EstadoNuevo", sql.NVarChar, detalles.estadoNuevo)
      .input("FechaAnterior", sql.Date, detalles.fechaAnterior || null)
      .input("FechaNueva", sql.Date, detalles.fechaNueva || null)
      .input("MontoAnterior", sql.Decimal(10, 2), detalles.montoAnterior || null)
      .input("MontoNuevo", sql.Decimal(10, 2), detalles.montoNuevo || null)
      .input("Motivo", sql.NVarChar, detalles.motivo || null)
      .input("Detalles", sql.NVarChar, detalles.descripcion || null)
      .query(`
        INSERT INTO HistorialMembresiasSocios (
          SocioID, MembresíaID, Accion, PlanAnterior, PlanNuevo,
          EstadoAnterior, EstadoNuevo, FechaAnterior, FechaNueva,
          MontoAnterior, MontoNuevo, Motivo, Detalles
        ) VALUES (
          @SocioID, @MembresiaID, @Accion, @PlanAnterior, @PlanNuevo,
          @EstadoAnterior, @EstadoNuevo, @FechaAnterior, @FechaNueva,
          @MontoAnterior, @MontoNuevo, @Motivo, @Detalles
        )
      `)
  } catch (error) {
    console.error("Error al registrar historial de membresía:", error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, planID, pagoID } = body

    if (!socioID || !planID || !pagoID) {
      return NextResponse.json({ error: "Datos incompletos para asignar la membresía" }, { status: 400 })
    }

    const pool = await getConnection()

    // 1) Duración del plan
    const planResult = await pool
      .request()
      .input("PlanID", planID)
      .query(`
        SELECT DuracionDias, NombrePlan
        FROM PlanesMembresía
        WHERE PlanID = @PlanID
      `)

    if (planResult.recordset.length === 0) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    const { DuracionDias, NombrePlan } = planResult.recordset[0]

    // 2) Monto pagado (desde Pagos)
    const pagoResult = await pool
      .request()
      .input("PagoID", pagoID)
      .query(`
        SELECT MontoPago
        FROM Pagos
        WHERE PagoID = @PagoID
      `)

    if (pagoResult.recordset.length === 0) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    const montoPagado = pagoResult.recordset[0].MontoPago

    // 3) Fechas
    const fechaInicio = new Date()
    const fechaVencimiento = new Date()
    fechaVencimiento.setDate(fechaVencimiento.getDate() + DuracionDias)

    // 4) Marcar membresías vigentes previas como vencidas
    const vigente = await pool
      .request()
      .input("SocioID", socioID)
      .query(`
  SELECT TOP 1 MembresíaID FROM Membresías
  WHERE SocioID=@SocioID AND Estado='Vigente'
`)
    if (vigente.recordset.length > 0) {
      return NextResponse.json({ error: "El socio ya tiene una membresía vigente" }, { status: 409 })
    }

    // 5) Crear nueva membresía
    const membresiaResult = await pool
      .request()
      .input("SocioID", socioID)
      .input("PlanID", planID)
      .input("FechaInicio", fechaInicio)
      .input("FechaVencimiento", fechaVencimiento)
      .input("MontoPagado", montoPagado)
      .query(`
        INSERT INTO Membresías (
          SocioID,
          PlanID,
          FechaInicio,
          FechaVencimiento,
          Estado,
          MontoPagado
        )
        OUTPUT INSERTED.MembresíaID
        VALUES (
          @SocioID,
          @PlanID,
          @FechaInicio,
          @FechaVencimiento,
          'Vigente',
          @MontoPagado
        );
      `)

    const membresiaID = membresiaResult.recordset[0].MembresíaID

    // 6) Vincular pago ↔ membresía
    await pool
      .request()
      .input("MembresíaID", membresiaID)
      .input("PagoID", pagoID)
      .query(`
        UPDATE Pagos
        SET MembresíaID = @MembresíaID
        WHERE PagoID = @PagoID;
      `)

    await registrarHistorialMembresia(pool, socioID, membresiaID, "Asignada", {
      planNuevo: NombrePlan,
      estadoNuevo: "Vigente",
      fechaNueva: fechaVencimiento,
      montoNuevo: montoPagado,
      descripcion: `Membresía ${NombrePlan} asignada hasta ${fechaVencimiento.toLocaleDateString()}`,
    })

    return NextResponse.json({ membresiaID })
  } catch (error) {
    console.error("Error al asignar membresía:", error)
    return NextResponse.json({ error: "Error al asignar membresía" }, { status: 500 })
  }
}
