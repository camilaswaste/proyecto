import { getConnection } from "@/lib/db"
import sql from "mssql"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { socioID, fotoURL } = body

    if (!socioID || !fotoURL) {
      return NextResponse.json({ error: "SocioID y fotoURL son requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("socioID", sql.Int, Number.parseInt(socioID))
      .input("fotoURL", sql.NVarChar, fotoURL)
      .query(`
        UPDATE Socios
        SET FotoURL = @fotoURL
        WHERE SocioID = @socioID
      `)

    return NextResponse.json({ message: "Foto de perfil actualizada exitosamente" })
  } catch (error) {
    console.error("[v0] Error al actualizar foto de perfil:", error)
    return NextResponse.json({ error: "Error al actualizar foto de perfil" }, { status: 500 })
  }
}
