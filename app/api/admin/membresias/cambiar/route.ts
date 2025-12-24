import { getUser } from "@/lib/auth-server"
import { getConnection } from "@/lib/db"
import sql from "mssql"
import { type NextRequest, NextResponse } from "next/server"

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

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)

    if (!user || user.rol !== "Administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { socioID, planID, mantenerFechas, motivo } = await request.json()

    if (!socioID || !planID) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    const planResult = await pool
      .request()
      .input("planID", sql.Int, planID)
      .query("SELECT NombrePlan, DuracionDias, Precio FROM PlanesMembresía WHERE PlanID = @planID")

    if (planResult.recordset.length === 0) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    const { NombrePlan: planNuevo, DuracionDias: duracionDias, Precio: precioNuevo } = planResult.recordset[0]

    const membresiaResult = await pool
      .request()
      .input("socioID", sql.Int, socioID)
      .query(`
        SELECT m.MembresíaID, m.FechaInicio, m.FechaVencimiento, m.Estado, m.MontoPagado,
               p.NombrePlan as PlanAnterior
        FROM Membresías m
        LEFT JOIN PlanesMembresía p ON m.PlanID = p.PlanID
        WHERE m.SocioID = @socioID 
        ORDER BY m.FechaInicio DESC
      `)

    if (membresiaResult.recordset.length === 0) {
      return NextResponse.json({ error: "No se encontró membresía activa" }, { status: 404 })
    }

    const membresiaActual = membresiaResult.recordset[0]
    let nuevaFechaInicio: Date
    let nuevaFechaVencimiento: Date

    if (mantenerFechas) {
      nuevaFechaInicio = new Date(membresiaActual.FechaInicio)
      nuevaFechaVencimiento = new Date(membresiaActual.FechaVencimiento)
    } else {
      nuevaFechaInicio = new Date()
      nuevaFechaVencimiento = new Date()
      nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + duracionDias)
    }

    await pool
      .request()
      .input("membresiaID", sql.Int, membresiaActual.MembresíaID)
      .input("planID", sql.Int, planID)
      .input("fechaInicio", sql.Date, nuevaFechaInicio)
      .input("fechaVencimiento", sql.Date, nuevaFechaVencimiento)
      .query(`
        UPDATE Membresías 
        SET PlanID = @planID, 
            FechaInicio = @fechaInicio, 
            FechaVencimiento = @fechaVencimiento
        WHERE MembresíaID = @membresiaID
      `)

    await registrarHistorialMembresia(pool, socioID, membresiaActual.MembresíaID, "Cambiada", {
      planAnterior: membresiaActual.PlanAnterior,
      planNuevo: planNuevo,
      estadoAnterior: membresiaActual.Estado,
      estadoNuevo: membresiaActual.Estado,
      fechaAnterior: membresiaActual.FechaVencimiento,
      fechaNueva: nuevaFechaVencimiento,
      montoAnterior: membresiaActual.MontoPagado,
      montoNuevo: precioNuevo,
      motivo: motivo,
      descripcion: `Plan cambiado de "${membresiaActual.PlanAnterior}" a "${planNuevo}"${mantenerFechas ? " manteniendo fechas" : ""}. ${motivo || ""}`,
    })

    return NextResponse.json({
      success: true,
      message: "Membresía cambiada exitosamente",
      nuevaFechaInicio,
      nuevaFechaVencimiento,
    })
  } catch (error: any) {
    console.error("Error al cambiar membresía:", error)
    return NextResponse.json({ error: error.message || "Error al cambiar membresía" }, { status: 500 })
  }
}
