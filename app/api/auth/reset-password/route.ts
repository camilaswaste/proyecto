import { hashPassword } from "@/lib/auth"
import { getConnection } from "@/lib/db"
import sql from "mssql"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token y nueva contraseña son requeridos" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const pool = await getConnection()

    // Verificar token válido y no expirado
    const tokenResult = await pool
      .request()
      .input("token", sql.VarChar, token)
      .query(`
        SELECT tr.TokenID, tr.UsuarioID, tr.Usado, tr.FechaExpiracion
        FROM TokensRecuperacion tr
        WHERE tr.Token = @token
          AND tr.Usado = 0
          AND tr.FechaExpiracion > GETDATE()
      `)

    if (tokenResult.recordset.length === 0) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }

    const tokenData = tokenResult.recordset[0]

    // Hash de la nueva contraseña
    const newPasswordHash = await hashPassword(newPassword)

    // Actualizar contraseña del usuario
    await pool
      .request()
      .input("usuarioID", sql.Int, tokenData.UsuarioID)
      .input("passwordHash", sql.VarChar, newPasswordHash)
      .query("UPDATE Usuarios SET PasswordHash = @passwordHash WHERE UsuarioID = @usuarioID")

    // Marcar token como usado
    await pool
      .request()
      .input("tokenID", sql.Int, tokenData.TokenID)
      .query("UPDATE TokensRecuperacion SET Usado = 1 WHERE TokenID = @tokenID")

    return NextResponse.json({ message: "Contraseña restablecida exitosamente" })
  } catch (error) {
    console.error("Error al restablecer contraseña:", error)
    return NextResponse.json({ error: "Error al restablecer contraseña" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword, adminOverride } = body

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email y nueva contraseña son requeridos" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    if (!adminOverride) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const pool = await getConnection()
    const newPasswordHash = await hashPassword(newPassword)

    const usuarioResult = await pool
      .request()
      .input("email", sql.VarChar, email)
      .input("passwordHash", sql.VarChar, newPasswordHash)
      .query("UPDATE Usuarios SET PasswordHash = @passwordHash WHERE Email = @email")

    if (usuarioResult.rowsAffected[0] > 0) {
      return NextResponse.json({ message: "Contraseña restablecida exitosamente" })
    }

    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  } catch (error) {
    console.error("Error al restablecer contraseña:", error)
    return NextResponse.json({ error: "Error al restablecer contraseña" }, { status: 500 })
  }
}
