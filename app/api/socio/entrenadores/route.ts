import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        e.EntrenadorID,
        u.Nombre,
        u.Apellido,
        u.Email,
        e.Especialidad,
        e.Certificaciones,
        e.FotoURL,
        e.FotoDemo
      FROM Entrenadores e
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE e.Activo = 1
      ORDER BY u.Nombre, u.Apellido
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener entrenadores:", error)
    return NextResponse.json({ error: "Error al obtener entrenadores" }, { status: 500 })
  }
}
