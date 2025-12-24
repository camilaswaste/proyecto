import { getConnection } from "@/lib/db"
import sql from "mssql"
import { NextResponse } from "next/server"

// Obtener horarios
export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        HorarioID,
        DiaSemana,
        HoraApertura,
        HoraCierre,
        Cerrado,
        Observaciones,
        FechaActualizacion
      FROM HorariosGimnasio
      ORDER BY DiaSemana
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener horarios:", error)
    return NextResponse.json({ error: "Error al obtener horarios" }, { status: 500 })
  }
}

// Actualizar horarios
export async function PUT(request: Request) {
  try {
    const horarios = await request.json()

    if (!Array.isArray(horarios)) {
      return NextResponse.json({ error: "Se esperaba un array de horarios" }, { status: 400 })
    }

    const pool = await getConnection()

    // Actualizar cada horario
    for (const horario of horarios) {
      await pool
        .request()
        .input("horarioID", sql.Int, horario.horarioID)
        .input("diaSemana", sql.Int, horario.diaSemana)
        .input("horaApertura", sql.Time, horario.horaApertura)
        .input("horaCierre", sql.Time, horario.horaCierre)
        .input("cerrado", sql.Bit, horario.cerrado)
        .input("observaciones", sql.NVarChar(500), horario.observaciones || null)
        .query(`
          UPDATE HorariosGimnasio
          SET DiaSemana = @diaSemana,
              HoraApertura = @horaApertura,
              HoraCierre = @horaCierre,
              Cerrado = @cerrado,
              Observaciones = @observaciones,
              FechaActualizacion = GETDATE()
          WHERE HorarioID = @horarioID
        `)
    }

    return NextResponse.json({ success: true, message: "Horarios actualizados exitosamente" })
  } catch (error) {
    console.error("Error al actualizar horarios:", error)
    return NextResponse.json({ error: "Error al actualizar horarios" }, { status: 500 })
  }
}
