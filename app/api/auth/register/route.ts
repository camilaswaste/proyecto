import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getConnection } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, apellido, email, nombreUsuario, password, telefono, rolID } = body

    // Validaciones básicas
    if (!nombre || !apellido || !email || !nombreUsuario || !password || !rolID) {
      return NextResponse.json({ error: "Todos los campos obligatorios deben ser completados" }, { status: 400 })
    }

    const pool = await getConnection()

    const roleResult = await pool
      .request()
      .input("rolID", rolID)
      .query("SELECT NombreRol FROM Roles WHERE RolID = @rolID")

    if (roleResult.recordset.length === 0) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 })
    }

    const roleName = roleResult.recordset[0].NombreRol

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    if (roleName === "Socio") {
      // Check if email already exists in Socios
      const emailCheck = await pool
        .request()
        .input("email", email)
        .query("SELECT SocioID FROM Socios WHERE Email = @email")

      if (emailCheck.recordset.length > 0) {
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
      }

      // Generate RUT placeholder (user should update later)
      const rutPlaceholder = `${Math.floor(Math.random() * 100000000)}-${Math.floor(Math.random() * 10)}`

      // Insert into Socios table
      const result = await pool
        .request()
        .input("rut", rutPlaceholder)
        .input("nombre", nombre)
        .input("apellido", apellido)
        .input("email", email)
        .input("telefono", telefono || null)
        .input("passwordHash", passwordHash)
        .input("estadoSocio", "Activo")
        .query(`
          INSERT INTO Socios (RUT, Nombre, Apellido, Email, Telefono, PasswordHash, EstadoSocio, FechaRegistro)
          OUTPUT INSERTED.SocioID
          VALUES (@rut, @nombre, @apellido, @email, @telefono, @passwordHash, @estadoSocio, GETDATE())
        `)

      const socioID = result.recordset[0].SocioID

      return NextResponse.json(
        {
          message: "Socio registrado exitosamente",
          socioID,
          note: "Por favor actualiza tu RUT en tu perfil",
        },
        { status: 201 },
      )
    } else {
      // Verificar si el email ya existe
      const emailCheck = await pool
        .request()
        .input("email", email)
        .query("SELECT UsuarioID FROM Usuarios WHERE Email = @email")

      if (emailCheck.recordset.length > 0) {
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
      }

      // Verificar si el nombre de usuario ya existe
      const usernameCheck = await pool
        .request()
        .input("nombreUsuario", nombreUsuario)
        .query("SELECT UsuarioID FROM Usuarios WHERE NombreUsuario = @nombreUsuario")

      if (usernameCheck.recordset.length > 0) {
        return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 400 })
      }

      // Insertar nuevo usuario
      const result = await pool
        .request()
        .input("rolID", rolID)
        .input("nombreUsuario", nombreUsuario)
        .input("email", email)
        .input("passwordHash", passwordHash)
        .input("nombre", nombre)
        .input("apellido", apellido)
        .input("telefono", telefono || null)
        .query(`
          INSERT INTO Usuarios (RolID, NombreUsuario, Email, PasswordHash, Nombre, Apellido, Telefono, FechaCreacion, Activo)
          OUTPUT INSERTED.UsuarioID
          VALUES (@rolID, @nombreUsuario, @email, @passwordHash, @nombre, @apellido, @telefono, GETDATE(), 1)
        `)

      const usuarioID = result.recordset[0].UsuarioID

      if (roleName === "Entrenador") {
        await pool
          .request()
          .input("usuarioID", usuarioID)
          .query(`
            INSERT INTO Entrenadores (UsuarioID, Activo)
            VALUES (@usuarioID, 1)
          `)
      }

      return NextResponse.json(
        {
          message: "Usuario registrado exitosamente",
          usuarioID,
        },
        { status: 201 },
      )
    }
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      {
        error: "Error al registrar usuario",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
