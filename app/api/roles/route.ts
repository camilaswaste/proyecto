import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT RolID, NombreRol, Descripcion
      FROM Roles
      ORDER BY RolID
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener roles:", error)
    return NextResponse.json({ error: "Error al obtener roles" }, { status: 500 })
  }
}
