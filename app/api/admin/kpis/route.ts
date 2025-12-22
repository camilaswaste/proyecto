import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()

    const sociosResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM Socios WHERE EstadoSocio = 'Activo'
    `)

    const ingresosResult = await pool.request().query(`
      SELECT ISNULL(SUM(MontoPago), 0) as total 
      FROM Pagos 
      WHERE MONTH(FechaPago) = MONTH(GETDATE()) 
      AND YEAR(FechaPago) = YEAR(GETDATE())
    `)

    const clasesResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM Clases
    `)

    const entrenadoresResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM Entrenadores WHERE Activo = 1
    `)

    return NextResponse.json({
      sociosActivos: sociosResult.recordset[0].total,
      ingresosMensuales: ingresosResult.recordset[0].total,
      clasesActivas: clasesResult.recordset[0].total,
      entrenadoresActivos: entrenadoresResult.recordset[0].total,
    })
  } catch (error) {
    console.error("Error al obtener KPIs:", error)
    return NextResponse.json({ error: "Error al obtener KPIs" }, { status: 500 })
  }
}
