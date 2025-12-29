import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        CategoriaID,
        NombreCategoria,
        TipoCategoria,
        Descripcion
      FROM CategoriasInventario
      ORDER BY NombreCategoria ASC
    `)

    const uniqueCategories = result.recordset.filter(
      (category, index, self) => index === self.findIndex((c) => c.NombreCategoria === category.NombreCategoria),
    )

    console.log("[v0] Total categories from DB:", result.recordset.length)
    console.log("[v0] Unique categories:", uniqueCategories.length)

    return NextResponse.json(uniqueCategories)
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}
