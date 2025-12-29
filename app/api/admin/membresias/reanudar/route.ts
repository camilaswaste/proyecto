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
    const { socioID, extenderVencimiento = true } = body

    if (!socioID) {
      return NextResponse.json({ error: "socioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const sus = await pool
      .request()
      .input("SocioID", socioID)
      .query(`
      SELECT TOP 1 m.MembresíaID, m.FechaVencimiento, m.DiasSuspension, p.NombrePlan
      FROM Membresías m
      LEFT JOIN PlanesMembresía p ON m.PlanID = p.PlanID
      WHERE m.SocioID = @SocioID AND m.Estado = 'Suspendida'
      ORDER BY m.FechaCreacion DESC
    `)

    if (sus.recordset.length === 0) {
      return NextResponse.json({ error: "No hay membresía suspendida para reanudar" }, { status: 409 })
    }

    const { MembresíaID, DiasSuspension, FechaVencimiento, NombrePlan } = sus.recordset[0]
    const dias = Number(DiasSuspension || 0)

    // Calcular nueva fecha si se extiende
    const nuevaFechaVencimiento = new Date(FechaVencimiento)
    if (extenderVencimiento && dias > 0) {
      nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + dias)
    }

    // 2) Reanudar (y opcionalmente extender vencimiento)
    await pool
      .request()
      .input("MembresiaID", MembresíaID)
      .input("Dias", dias)
      .input("Extender", extenderVencimiento ? 1 : 0)
      .query(`
        UPDATE Membresías
        SET Estado = 'Vigente',
            FechaVencimiento = CASE
              WHEN @Extender = 1 AND @Dias > 0
                THEN DATEADD(day, @Dias, FechaVencimiento)
              ELSE FechaVencimiento
            END,
            DiasSuspension = NULL,
            FechaSuspension = NULL
        WHERE MembresíaID = @MembresiaID
      `)

    await registrarHistorialMembresia(pool, socioID, MembresíaID, "Reanudada", {
      planNuevo: NombrePlan,
      estadoAnterior: "Suspendida",
      estadoNuevo: "Vigente",
      fechaAnterior: FechaVencimiento,
      fechaNueva: nuevaFechaVencimiento,
      descripcion: `Membresía reanudada${extenderVencimiento && dias > 0 ? ` con extensión de ${dias} días` : ""}`,
    })

    return NextResponse.json({ success: true, membresiaID: MembresíaID, extendido: extenderVencimiento })
  } catch (err) {
    console.error("Error al reanudar membresía:", err)
    return NextResponse.json({ error: "Error interno al reanudar membresía" }, { status: 500 })
  }
}
