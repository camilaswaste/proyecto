import { getUser } from "@/lib/auth-server"
import { getConnection } from "@/lib/db"
import sql from "mssql"
import { type NextRequest, NextResponse } from "next/server"

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

    // Obtener información del nuevo plan
    const planResult = await pool
      .request()
      .input("planID", sql.Int, planID)
      .query("SELECT DuracionDias FROM PlanesMembresía WHERE PlanID = @planID")

    if (planResult.recordset.length === 0) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    const duracionDias = planResult.recordset[0].DuracionDias

    // Obtener la membresía actual
    const membresiaResult = await pool
      .request()
      .input("socioID", sql.Int, socioID)
      .query(`
        SELECT MembresíaID, FechaInicio, FechaVencimiento 
        FROM Membresías 
        WHERE SocioID = @socioID 
        ORDER BY FechaInicio DESC
      `)

    if (membresiaResult.recordset.length === 0) {
      return NextResponse.json({ error: "No se encontró membresía activa" }, { status: 404 })
    }

    const membresiaActual = membresiaResult.recordset[0]
    let nuevaFechaInicio: Date
    let nuevaFechaVencimiento: Date

    if (mantenerFechas) {
      // Mantener las fechas actuales
      nuevaFechaInicio = new Date(membresiaActual.FechaInicio)
      nuevaFechaVencimiento = new Date(membresiaActual.FechaVencimiento)
    } else {
      // Calcular nuevas fechas basadas en el nuevo plan
      nuevaFechaInicio = new Date()
      nuevaFechaVencimiento = new Date()
      nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + duracionDias)
    }

    // Actualizar la membresía
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

    // Registrar en historial (si existe tabla de historial)
    try {
      await pool
        .request()
        .input("socioID", sql.Int, socioID)
        .input("accion", sql.VarChar, "Cambio de Membresía")
        .input("descripcion", sql.VarChar, motivo)
        .input("fecha", sql.DateTime, new Date())
        .query(`
          INSERT INTO HistorialMembresías (SocioID, Acción, Descripción, Fecha)
          VALUES (@socioID, @accion, @descripcion, @fecha)
        `)
    } catch (historialError) {
      // Si no existe la tabla de historial, continuar sin error
      console.log("No se pudo registrar en historial:", historialError)
    }

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
