import { getConnection } from "@/lib/db"
import sql from "mssql"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { entrenadorID, fotoURL } = body

    if (!entrenadorID || !fotoURL) {
      return NextResponse.json({ error: "EntrenadorID y fotoURL son requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("entrenadorID", sql.Int, entrenadorID)
      .input("fotoURL", sql.NVarChar, fotoURL)
      .query(`
        UPDATE Entrenadores
        SET FotoURL = @fotoURL
        WHERE EntrenadorID = @entrenadorID
      `)

    return NextResponse.json({
      message: "Foto de perfil actualizada exitosamente",
      fotoURL,
    })
  } catch (error) {
    console.error("Error al actualizar foto de perfil del entrenador:", error)
    return NextResponse.json({ error: "Error al actualizar foto de perfil" }, { status: 500 })
  }
}
