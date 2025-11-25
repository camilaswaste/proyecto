import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
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
        Beneficios,
        Activo
      FROM PlanesMembresía
      ORDER BY Precio ASC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener membresías:", error)
    return NextResponse.json({ error: "Error al obtener membresías" }, { status: 500 })
  }
}

//CreaMOS PLAN DE MEMBRESIA
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombrePlan, descripcion, precio, duracionDias, tipoPlan, beneficios } = body

    const pool = await getConnection()

    await pool
      .request()
      .input("nombrePlan", nombrePlan)
      .input("descripcion", descripcion)
      .input("precio", precio)
      .input("duracionDias", duracionDias)
      .input("tipoPlan", tipoPlan)
      .input("beneficios", beneficios)
      .input("activo", true)
      .query(`
        INSERT INTO PlanesMembresía (NombrePlan, Descripcion, Precio, DuracionDias, TipoPlan, Beneficios, Activo)
        VALUES (@nombrePlan, @descripcion, @precio, @duracionDias, @tipoPlan, @beneficios, @activo)
      `)

    return NextResponse.json({ success: true, message: "Plan creado exitosamente" })
  } catch (error) {
    console.error("Error al crear plan:", error)
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 })
  }
}

//PUT PARA ACTUALZIAR DEFINICION DE UN PLAN (CRUD)
//ASIGNAR ACTIVAR MEMBRESIA A UN SOCIO
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const pool = await getConnection()

    // CASO 1: ASIGNACIÓN DE MEMBRESÍA (Detectado por la presencia de pagoID)
    if (body.pagoID && body.socioID) {
        const { socioID, planID, pagoID } = body

        // 1. Obtener duración del plan
        const planResult = await pool.request()
            .input('planID', sql.Int, planID)
            .query(`SELECT DuracionDias FROM PlanesMembresía WHERE PlanID = @planID`)
        
        const plan = planResult.recordset[0]
        if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

        // 2. Desactivar membresía anterior
        await pool.request()
            .input("socioID", socioID)
            .query(`UPDATE Membresías SET Estado = 'Vencida' WHERE SocioID = @socioID AND Estado = 'Vigente'`)

        // 3. Calcular Fechas
        const fechaInicio = new Date()
        const fechaFin = new Date()
        fechaFin.setDate(fechaFin.getDate() + plan.DuracionDias)

        // 4. Obtener monto real pagado
        const montoResult = await pool.request()
            .input("pagoID", pagoID)
            .query(`SELECT MontoPago FROM Pagos WHERE PagoID = @pagoID`)
        const montoPagado = montoResult.recordset[0]?.MontoPago || 0

        // 5. Insertar Membresía VIGENTE
        await pool.request()
            .input("socioID", socioID)
            .input("planID", planID)
            .input("fechaInicio", fechaInicio)
            .input("fechaFin", fechaFin)
            .input("montoPagado", montoPagado)
            .query(`
                INSERT INTO Membresías (SocioID, PlanID, FechaInicio, FechaVencimiento, Estado, MontoPagado)
                VALUES (@socioID, @planID, @fechaInicio, @fechaFin, 'Vigente', @montoPagado)
            `)

        // 6. Activar Socio
        await pool.request()
            .input("socioID", socioID)
            .query(`UPDATE Socios SET EstadoSocio = 'Activo' WHERE SocioID = @socioID AND EstadoSocio = 'Inactivo'`)

        // 7. Limpiar concepto del pago
        await pool.request()
             .input("pagoID", pagoID)
             .query(`UPDATE Pagos SET Concepto = REPLACE(Concepto, ' - PENDIENTE DE ASIGNACIÓN', '') WHERE PagoID = @pagoID`)

        return NextResponse.json({ success: true, message: "Membresía asignada y activada exitosamente" })
    } 
    
    // CASO 2: ACTUALIZAR DATOS DEL PLAN (CRUD ADMIN)
    else {
        const { planID, nombrePlan, descripcion, precio, duracionDias, tipoPlan, beneficios, activo } = body

        await pool
          .request()
          .input("planID", planID)
          .input("nombrePlan", nombrePlan)
          .input("descripcion", descripcion)
          .input("precio", precio)
          .input("duracionDias", duracionDias)
          .input("tipoPlan", tipoPlan)
          .input("beneficios", beneficios)
          .input("activo", activo)
          .query(`
            UPDATE PlanesMembresía
            SET NombrePlan = @nombrePlan, Descripcion = @descripcion, Precio = @precio,
                DuracionDias = @duracionDias, TipoPlan = @tipoPlan, Beneficios = @beneficios, Activo = @activo
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

    // Soft delete - just deactivate
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
