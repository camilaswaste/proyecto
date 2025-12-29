import { generateToken, verifyPassword } from "@/lib/auth"
import { getConnection, sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    const usuarioResult = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`
        SELECT u.UsuarioID, u.NombreUsuario, u.Email, u.PasswordHash, 
               u.Nombre, u.Apellido, u.Activo, u.RequiereCambioPassword, 
               r.NombreRol, r.RolID,
               e.EntrenadorID
        FROM Usuarios u
        INNER JOIN Roles r ON u.RolID = r.RolID
        LEFT JOIN Entrenadores e ON u.UsuarioID = e.UsuarioID
        WHERE u.Email = @email AND u.Activo = 1
      `)

    if (usuarioResult.recordset.length > 0) {
      const user = usuarioResult.recordset[0]

      const isValidPassword = await verifyPassword(password, user.PasswordHash)

      if (!isValidPassword) {
        return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
      }

      await pool
        .request()
        .input("usuarioID", sql.Int, user.UsuarioID)
        .query("UPDATE Usuarios SET UltimoAcceso = GETDATE() WHERE UsuarioID = @usuarioID")

      const tokenPayload: any = {
        usuarioID: user.UsuarioID,
        nombreUsuario: user.NombreUsuario,
        email: user.Email,
        rol: user.NombreRol,
        rolID: user.RolID,
      }

      if (user.EntrenadorID) {
        tokenPayload.entrenadorID = user.EntrenadorID
      }

      const token = generateToken(tokenPayload)

      const userResponse: any = {
        usuarioID: user.UsuarioID,
        nombreUsuario: user.NombreUsuario,
        email: user.Email,
        nombre: user.Nombre,
        apellido: user.Apellido,
        rol: user.NombreRol,
        rolID: user.RolID,
        requiereCambioPassword: user.RequiereCambioPassword || false,
      }

      if (user.EntrenadorID) {
        userResponse.entrenadorID = user.EntrenadorID
      }

      return NextResponse.json({
        token,
        user: userResponse,
      })
    }

    // No usuario found, checking Socios table
    const socioResult = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`
        SELECT s.SocioID, s.Email, s.PasswordHash, s.Nombre, s.Apellido, s.EstadoSocio, s.RequiereCambioPassword
        FROM Socios s
        WHERE s.Email = @email AND s.EstadoSocio = 'Activo'
      `)

    if (socioResult.recordset.length === 0) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const socio = socioResult.recordset[0]

    const isValidPassword = await verifyPassword(password, socio.PasswordHash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const roleResult = await pool.request().query("SELECT RolID FROM Roles WHERE NombreRol = 'Socio'")

    const rolID = roleResult.recordset.length > 0 ? roleResult.recordset[0].RolID : 3

    const token = generateToken({
      usuarioID: socio.SocioID,
      socioID: socio.SocioID,
      nombreUsuario: socio.Email,
      email: socio.Email,
      rol: "Socio",
      rolID: rolID,
    })

    return NextResponse.json({
      token,
      user: {
        usuarioID: socio.SocioID,
        socioID: socio.SocioID,
        nombreUsuario: socio.Email,
        email: socio.Email,
        nombre: socio.Nombre,
        apellido: socio.Apellido,
        rol: "Socio",
        rolID: rolID,
        requiereCambioPassword: socio.RequiereCambioPassword || false,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
