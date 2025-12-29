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
    const { socioID, motivo } = body

    if (!socioID || !motivo) {
      return NextResponse.json({ error: "socioID y motivo son requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    const target = await pool
      .request()
      .input("SocioID", socioID)
      .query(`
        SELECT TOP 1 m.MembresíaID, m.Estado, m.FechaVencimiento, p.NombrePlan
        FROM Membresías m
        LEFT JOIN PlanesMembresía p ON m.PlanID = p.PlanID
        WHERE m.SocioID = @SocioID AND m.Estado IN ('Vigente', 'Suspendida')
        ORDER BY m.FechaCreacion DESC
      `)

    if (target.recordset.length === 0) {
      return NextResponse.json({ error: "No existe membresía vigente/suspendida para cancelar" }, { status: 409 })
    }

    const { MembresíaID: membresiaID, Estado: estadoAnterior, FechaVencimiento, NombrePlan } = target.recordset[0]

    await pool
      .request()
      .input("MembresiaID", membresiaID)
      .input("Motivo", motivo)
      .query(`
        UPDATE Membresías
        SET Estado = 'Cancelada',
            MotivoEstado = @Motivo
        WHERE MembresíaID = @MembresiaID
      `)

    await registrarHistorialMembresia(pool, socioID, membresiaID, "Cancelada", {
      planNuevo: NombrePlan,
      estadoAnterior: estadoAnterior,
      estadoNuevo: "Cancelada",
      fechaAnterior: FechaVencimiento,
      fechaNueva: null,
      motivo: motivo,
      descripcion: `Membresía cancelada: ${motivo}`,
    })

    return NextResponse.json({ success: true, membresiaID })
  } catch (error) {
    console.error("Error al cancelar membresía:", error)
    return NextResponse.json({ error: "Error interno al cancelar membresía" }, { status: 500 })
  }
}
