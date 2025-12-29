import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoAccion = searchParams.get("tipoAccion")
    const busqueda = searchParams.get("busqueda")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    const pool = await getConnection()

    let query = `
      SELECT 
        AuditoriaID,
        PlanID,
        NombrePlan,
        TipoAccion,
        FechaAccion,
        CamposModificados,
        ValoresAnteriores,
        ValoresNuevos,
        Descripcion
      FROM AuditoriaMembresías
      WHERE 1=1
    `

    const sqlRequest = pool.request()

    if (tipoAccion && tipoAccion !== "TODAS") {
      query += ` AND TipoAccion = @tipoAccion`
      sqlRequest.input("tipoAccion", tipoAccion)
    }

    if (busqueda) {
      query += ` AND (NombrePlan LIKE @busqueda OR Descripcion LIKE @busqueda)`
      sqlRequest.input("busqueda", `%${busqueda}%`)
    }

    if (fechaDesde) {
      query += ` AND CAST(FechaAccion AS DATE) >= @fechaDesde`
      sqlRequest.input("fechaDesde", fechaDesde)
    }

    if (fechaHasta) {
      query += ` AND CAST(FechaAccion AS DATE) <= @fechaHasta`
      sqlRequest.input("fechaHasta", fechaHasta)
    }

    query += ` ORDER BY FechaAccion DESC`

    const result = await sqlRequest.query(query)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener historial:", error)
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 })
  }
}
