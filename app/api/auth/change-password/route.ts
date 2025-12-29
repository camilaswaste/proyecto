import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { verifyPassword, hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, currentPassword, newPassword, isFirstLogin } = body

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const pool = await getConnection()

    // Check if user exists in Usuarios table
    const usuarioResult = await pool
      .request()
      .input("email", email)
      .query("SELECT UsuarioID, PasswordHash FROM Usuarios WHERE Email = @email AND Activo = 1")

    if (usuarioResult.recordset.length > 0) {
      const user = usuarioResult.recordset[0]

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.PasswordHash)
      if (!isValid) {
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 })
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword)

      await pool
        .request()
        .input("usuarioID", user.UsuarioID)
        .input("passwordHash", newPasswordHash)
        .query(`
          UPDATE Usuarios 
          SET PasswordHash = @passwordHash,
              RequiereCambioPassword = 0
          WHERE UsuarioID = @usuarioID
        `)

      return NextResponse.json({
        message: "Contraseña actualizada exitosamente",
        requiereCambioPassword: false,
      })
    }

    // Check if user exists in Socios table
    const socioResult = await pool
      .request()
      .input("email", email)
      .query("SELECT SocioID, PasswordHash FROM Socios WHERE Email = @email AND EstadoSocio = 'Activo'")

    if (socioResult.recordset.length > 0) {
      const socio = socioResult.recordset[0]

      // Verify current password
      const isValid = await verifyPassword(currentPassword, socio.PasswordHash)
      if (!isValid) {
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 })
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword)

      await pool
        .request()
        .input("socioID", socio.SocioID)
        .input("passwordHash", newPasswordHash)
        .query(`
          UPDATE Socios 
          SET PasswordHash = @passwordHash,
              RequiereCambioPassword = 0
          WHERE SocioID = @socioID
        `)

      return NextResponse.json({
        message: "Contraseña actualizada exitosamente",
        requiereCambioPassword: false,
      })
    }

    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  } catch (error) {
    console.error("Error al cambiar contraseña:", error)
    return NextResponse.json({ error: "Error al cambiar contraseña" }, { status: 500 })
  }
}
