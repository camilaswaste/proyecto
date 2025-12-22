import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

// Request password reset (would normally send email)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    // Check if email exists in Usuarios or Socios
    const usuarioResult = await pool
      .request()
      .input("email", email)
      .query("SELECT UsuarioID FROM Usuarios WHERE Email = @email")

    const socioResult = await pool
      .request()
      .input("email", email)
      .query("SELECT SocioID FROM Socios WHERE Email = @email")

    if (usuarioResult.recordset.length === 0 && socioResult.recordset.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
      })
    }

    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Store it in the database with expiration
    // 3. Send an email with the reset link
    // For now, we'll just return a success message

    return NextResponse.json({
      message: "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
    })
  } catch (error) {
    console.error("Error al solicitar restablecimiento:", error)
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 })
  }
}

// Reset password with token (simplified version)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { email, newPassword, adminOverride } = body

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email y nueva contraseña son requeridos" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // In production, verify reset token here
    if (!adminOverride) {
      return NextResponse.json({ error: "Token de restablecimiento inválido o expirado" }, { status: 401 })
    }

    const pool = await getConnection()
    const newPasswordHash = await hashPassword(newPassword)

    // Try updating in Usuarios table
    const usuarioResult = await pool
      .request()
      .input("email", email)
      .input("passwordHash", newPasswordHash)
      .query("UPDATE Usuarios SET PasswordHash = @passwordHash WHERE Email = @email")

    if (usuarioResult.rowsAffected[0] > 0) {
      return NextResponse.json({ message: "Contraseña restablecida exitosamente" })
    }

    // Try updating in Socios table
    const socioResult = await pool
      .request()
      .input("email", email)
      .input("passwordHash", newPasswordHash)
      .query("UPDATE Socios SET PasswordHash = @passwordHash WHERE Email = @email")

    if (socioResult.rowsAffected[0] > 0) {
      return NextResponse.json({ message: "Contraseña restablecida exitosamente" })
    }

    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  } catch (error) {
    console.error("Error al restablecer contraseña:", error)
    return NextResponse.json({ error: "Error al restablecer contraseña" }, { status: 500 })
  }
}
