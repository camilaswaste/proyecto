import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || "ingresos" // ingresos, socios, asistencia
    const meses = Number.parseInt(searchParams.get("meses") || "6")

    const pool = await getConnection()

    let query = ""

    switch (tipo) {
      case "ingresos":
        query = `
          SELECT 
            FORMAT(FechaPago, 'yyyy-MM') as mes,
            SUM(MontoPago) as total,
            COUNT(*) as transacciones,
            AVG(MontoPago) as promedio
          FROM Pagos
          WHERE FechaPago >= DATEADD(MONTH, -${meses}, GETDATE())
          GROUP BY FORMAT(FechaPago, 'yyyy-MM')
          ORDER BY mes
        `
        break

      case "socios":
        query = `
          SELECT 
            FORMAT(FechaRegistro, 'yyyy-MM') as mes,
            COUNT(*) as nuevosSocios
          FROM Socios
          WHERE FechaRegistro >= DATEADD(MONTH, -${meses}, GETDATE())
          GROUP BY FORMAT(FechaRegistro, 'yyyy-MM')
          ORDER BY mes
        `
        break

      case "asistencia":
        query = `
          SELECT 
            FORMAT(FechaHoraIngreso, 'yyyy-MM') as mes,
            COUNT(*) as totalAsistencias,
            COUNT(DISTINCT SocioID) as sociosUnicos
          FROM Asistencias
          WHERE FechaHoraIngreso >= DATEADD(MONTH, -${meses}, GETDATE())
          GROUP BY FORMAT(FechaHoraIngreso, 'yyyy-MM')
          ORDER BY mes
        `
        break
    }

    const result = await pool.request().query(query)

    return NextResponse.json({
      tipo,
      meses,
      datos: result.recordset,
    })
  } catch (error) {
    console.error("[v0] Error al obtener tendencias:", error)
    return NextResponse.json(
      { error: "Error al obtener tendencias", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}