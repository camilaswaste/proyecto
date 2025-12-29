import { getConnection } from "@/lib/db"
import sql from "mssql"
import { NextResponse } from "next/server"

function formatTimeForInput(timeValue: any): string {
  if (!timeValue) return "00:00"

  // If it's already in HH:mm format
  if (typeof timeValue === "string" && /^\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue
  }

  // If it's an ISO timestamp
  if (typeof timeValue === "string" && timeValue.includes("T")) {
    const date = new Date(timeValue)
    const hours = String(date.getUTCHours()).padStart(2, "0")
    const minutes = String(date.getUTCMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
  }

  // If it's a Date object
  if (timeValue instanceof Date) {
    const hours = String(timeValue.getUTCHours()).padStart(2, "0")
    const minutes = String(timeValue.getUTCMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
  }

  return "00:00"
}

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

    const horarios = result.recordset.map((h) => ({
      ...h,
      HoraApertura: formatTimeForInput(h.HoraApertura),
      HoraCierre: formatTimeForInput(h.HoraCierre),
    }))

    return NextResponse.json(horarios)
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
      const horaApertura = horario.horaApertura.length === 5 ? `${horario.horaApertura}:00` : horario.horaApertura
      const horaCierre = horario.horaCierre.length === 5 ? `${horario.horaCierre}:00` : horario.horaCierre

      await pool
        .request()
        .input("horarioID", sql.Int, horario.horarioID)
        .input("diaSemana", sql.Int, horario.diaSemana)
        .input("horaApertura", sql.VarChar(8), horaApertura)
        .input("horaCierre", sql.VarChar(8), horaCierre)
        .input("cerrado", sql.Bit, horario.cerrado)
        .input("observaciones", sql.NVarChar(500), horario.observaciones || null)
        .query(`
          UPDATE HorariosGimnasio
          SET DiaSemana = @diaSemana,
              HoraApertura = CAST(@horaApertura AS TIME),
              HoraCierre = CAST(@horaCierre AS TIME),
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
