import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

// GET - Obtener detalle de una clase específica
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] Obteniendo detalle de clase:", id)

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("claseId", id)
      .query(`
        SELECT 
          c.*,
          CONCAT(u.Nombre, ' ', u.Apellido) AS NombreEntrenador,
          u.Email AS EmailEntrenador,
          e.FotoURL AS FotoEntrenador,
          (SELECT COUNT(*) FROM ReservasClases WHERE ClaseID = c.ClaseID AND Estado != 'Cancelada') AS CuposOcupados
        FROM Clases c
        LEFT JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        LEFT JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE c.ClaseID = @claseId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })
    }

    const clase = result.recordset[0]
    console.log("[v0] Clase encontrada:", clase.NombreClase)

    return NextResponse.json(clase)
  } catch (error: any) {
    console.error("[v0] Error al obtener detalle de clase:", error)
    return NextResponse.json({ error: "Error al obtener detalle de clase", details: error.message }, { status: 500 })
  }
}
