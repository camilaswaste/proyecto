import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()

    console.log("[v0] Obteniendo estadísticas de asistencia")

    const result = await pool.request().query(`
      DECLARE @hoy DATE = CAST(GETDATE() AS DATE);
      DECLARE @ayer DATE = DATEADD(DAY, -1, @hoy);

      SELECT 
        (SELECT COUNT(DISTINCT SocioID) 
         FROM Asistencias 
         WHERE CAST(FechaHoraIngreso AS DATE) = @hoy 
           AND FechaHoraSalida IS NULL) as SociosActivosAhora,
        
        (SELECT COUNT(DISTINCT SocioID) 
         FROM Asistencias 
         WHERE CAST(FechaHoraIngreso AS DATE) = @hoy) as TotalDelDia,
        
        (SELECT COUNT(DISTINCT SocioID) 
         FROM Asistencias 
         WHERE CAST(FechaHoraIngreso AS DATE) = @ayer) as TotalAyer,
        
        (SELECT AVG(DATEDIFF(MINUTE, FechaHoraIngreso, FechaHoraSalida))
         FROM Asistencias 
         WHERE CAST(FechaHoraIngreso AS DATE) = @hoy 
           AND FechaHoraSalida IS NOT NULL) as PromedioMinutos
    `)

    const data = result.recordset[0]
    console.log("[v0] Estadísticas obtenidas:", data)

    const promedioPermanencia = data.PromedioMinutos
      ? `${Math.floor(data.PromedioMinutos / 60)}h ${data.PromedioMinutos % 60}m`
      : "0h"

    const comparacionAyer =
      data.TotalAyer > 0 ? Math.round(((data.TotalDelDia - data.TotalAyer) / data.TotalAyer) * 100) : 0

    return NextResponse.json({
      sociosActivosAhora: data.SociosActivosAhora,
      totalDelDia: data.TotalDelDia,
      promedioPermanencia,
      comparacionAyer,
    })
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
  }
}
