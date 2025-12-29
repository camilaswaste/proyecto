import { getConnection } from "@/lib/db"
import bcrypt from "bcryptjs"
import sql from "mssql"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioID = searchParams.get("usuarioID")

    if (!usuarioID) {
      return NextResponse.json({ error: "UsuarioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("usuarioID", sql.Int, Number.parseInt(usuarioID))
      .query(`
        SELECT 
          UsuarioID,
          Nombre,
          Apellido,
          Email,
          Telefono,
          FotoPerfil
        FROM Usuarios
        WHERE UsuarioID = @usuarioID
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Administrador no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("[v0] Error al obtener perfil del administrador:", error)
    return NextResponse.json({ error: "Error al obtener perfil del administrador" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { usuarioID, nombre, apellido, email, currentPassword, newPassword } = body

    if (!usuarioID) {
      return NextResponse.json({ error: "UsuarioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    // Si se está cambiando la contraseña
    if (currentPassword && newPassword) {
      const userResult = await pool
        .request()
        .input("usuarioID", sql.Int, usuarioID)
        .query(`SELECT PasswordHash FROM Usuarios WHERE UsuarioID = @usuarioID`)

      if (userResult.recordset.length === 0) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, userResult.recordset[0].PasswordHash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 })
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      await pool
        .request()
        .input("usuarioID", sql.Int, usuarioID)
        .input("passwordHash", sql.NVarChar, newPasswordHash)
        .query(`UPDATE Usuarios SET PasswordHash = @passwordHash WHERE UsuarioID = @usuarioID`)

      return NextResponse.json({ message: "Contraseña actualizada exitosamente" })
    }

    await pool
      .request()
      .input("usuarioID", sql.Int, usuarioID)
      .input("nombre", sql.NVarChar, nombre)
      .input("apellido", sql.NVarChar, apellido)
      .input("email", sql.NVarChar, email)
      .query(`
        UPDATE Usuarios
        SET 
          Nombre = @nombre,
          Apellido = @apellido,
          Email = @email
        WHERE UsuarioID = @usuarioID
      `)

    return NextResponse.json({ message: "Perfil actualizado exitosamente" })
  } catch (error) {
    console.error("Error al actualizar perfil del administrador:", error)
    return NextResponse.json({ error: "Error al actualizar perfil del administrador" }, { status: 500 })
  }
}
