import { getConnection } from "@/lib/db"
import sql from "mssql"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { usuarioID, fotoURL } = body

    if (!usuarioID || !fotoURL) {
      return NextResponse.json({ error: "UsuarioID y fotoURL son requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("usuarioID", sql.Int, Number.parseInt(usuarioID))
      .input("fotoURL", sql.NVarChar, fotoURL)
      .query(`
        UPDATE Usuarios
        SET FotoPerfil = @fotoURL
        WHERE UsuarioID = @usuarioID
      `)

    return NextResponse.json({ message: "Foto de perfil actualizada exitosamente" })
  } catch (error) {
    console.error("[v0] Error al actualizar foto de perfil:", error)
    return NextResponse.json({ error: "Error al actualizar foto de perfil" }, { status: 500 })
  }
}
