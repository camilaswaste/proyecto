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
    const { socioID, dias, motivo } = body

    if (!socioID || !dias || Number(dias) <= 0) {
      return NextResponse.json({ error: "Datos inválidos (socioID y dias > 0)" }, { status: 400 })
    }

    const pool = await getConnection()

    const vigente = await pool
      .request()
      .input("SocioID", socioID)
      .query(`
        SELECT TOP 1 m.MembresíaID, m.FechaVencimiento, p.NombrePlan
        FROM Membresías m
        LEFT JOIN PlanesMembresía p ON m.PlanID = p.PlanID
        WHERE m.SocioID = @SocioID AND m.Estado = 'Vigente'
        ORDER BY m.FechaCreacion DESC
      `)

    if (vigente.recordset.length === 0) {
      return NextResponse.json({ error: "No existe membresía vigente para pausar" }, { status: 409 })
    }

    const { MembresíaID: membresiaID, FechaVencimiento, NombrePlan } = vigente.recordset[0]

    await pool
      .request()
      .input("MembresiaID", membresiaID)
      .input("Dias", Number(dias))
      .input("Motivo", motivo || null)
      .query(`
        UPDATE Membresías
        SET Estado = 'Suspendida',
            FechaSuspension = CAST(GETDATE() AS DATE),
            DiasSuspension = @Dias,
            MotivoEstado = @Motivo
        WHERE MembresíaID = @MembresiaID
      `)

    await registrarHistorialMembresia(pool, socioID, membresiaID, "Suspendida", {
      planNuevo: NombrePlan,
      estadoAnterior: "Vigente",
      estadoNuevo: "Suspendida",
      fechaAnterior: FechaVencimiento,
      fechaNueva: FechaVencimiento,
      motivo: motivo,
      descripcion: `Membresía suspendida por ${dias} días. ${motivo || ""}`,
    })

    return NextResponse.json({ success: true, membresiaID })
  } catch (error) {
    console.error("Error al pausar membresía:", error)
    return NextResponse.json({ error: "Error interno al pausar membresía" }, { status: 500 })
  }
}
