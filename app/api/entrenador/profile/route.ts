import { getConnection } from "@/lib/db"
import bcrypt from "bcryptjs"
import sql from "mssql"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[v0] ========== ENTRENADOR PROFILE API GET CALLED ==========")
  console.log("[v0] Request URL:", request.url)

  try {
    const { searchParams } = new URL(request.url)
    const entrenadorID = searchParams.get("entrenadorID")
    const usuarioID = searchParams.get("usuarioID")

    console.log("[v0] Extracted entrenadorID:", entrenadorID)
    console.log("[v0] Extracted usuarioID:", usuarioID)

    if (!entrenadorID && !usuarioID) {
      console.log("[v0] ERROR: No entrenadorID or usuarioID provided")
      return NextResponse.json({ error: "EntrenadorID o UsuarioID es requerido" }, { status: 400 })
    }

    console.log("[v0] Getting database connection...")
    const pool = await getConnection()
    console.log("[v0] Database connection successful")

    let result

    if (usuarioID) {
      console.log("[v0] Executing query with usuarioID:", usuarioID)
      result = await pool
        .request()
        .input("usuarioID", sql.Int, Number.parseInt(usuarioID))
        .query(`
          SELECT 
            e.EntrenadorID,
            e.FotoURL,
            u.Nombre,
            u.Apellido,
            u.Email,
            u.Telefono
          FROM Entrenadores e
          INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
          WHERE u.UsuarioID = @usuarioID
        `)
    } else {
      console.log("[v0] Executing query with entrenadorID:", entrenadorID)
      result = await pool
        .request()
        .input("entrenadorID", sql.Int, Number.parseInt(entrenadorID!))
        .query(`
          SELECT 
            e.EntrenadorID,
            e.FotoURL,
            u.Nombre,
            u.Apellido,
            u.Email,
            u.Telefono
          FROM Entrenadores e
          INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
          WHERE e.EntrenadorID = @entrenadorID
        `)
    }

    console.log("[v0] Query result count:", result.recordset.length)
    console.log("[v0] Query result data:", JSON.stringify(result.recordset[0]))

    if (result.recordset.length === 0) {
      console.log("[v0] ERROR: Entrenador not found in database")
      return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 404 })
    }

    console.log("[v0] Returning success response")
    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("[v0] EXCEPTION in GET entrenador profile:", error)
    return NextResponse.json({ error: "Error al obtener perfil del entrenador" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { entrenadorID, nombre, apellido, email, telefono, currentPassword, newPassword } = body

    if (!entrenadorID) {
      return NextResponse.json({ error: "EntrenadorID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const entrenadorResult = await pool
      .request()
      .input("entrenadorID", sql.Int, entrenadorID)
      .query("SELECT UsuarioID FROM Entrenadores WHERE EntrenadorID = @entrenadorID")

    if (entrenadorResult.recordset.length === 0) {
      return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 404 })
    }

    const usuarioID = entrenadorResult.recordset[0].UsuarioID

    if (currentPassword && newPassword) {
      const userResult = await pool
        .request()
        .input("usuarioID", sql.Int, usuarioID)
        .query(`SELECT Contrasena FROM Usuarios WHERE UsuarioID = @usuarioID`)

      if (userResult.recordset.length === 0) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, userResult.recordset[0].Contrasena)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 })
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      await pool
        .request()
        .input("usuarioID", sql.Int, usuarioID)
        .input("contrasena", sql.NVarChar, newPasswordHash)
        .query(`UPDATE Usuarios SET Contrasena = @contrasena WHERE UsuarioID = @usuarioID`)

      return NextResponse.json({ message: "Contraseña actualizada exitosamente" })
    }

    await pool
      .request()
      .input("usuarioID", sql.Int, usuarioID)
      .input("nombre", sql.NVarChar, nombre)
      .input("apellido", sql.NVarChar, apellido)
      .input("email", sql.NVarChar, email)
      .input("telefono", sql.NVarChar, telefono || null)
      .query(`
        UPDATE Usuarios
        SET 
          Nombre = @nombre,
          Apellido = @apellido,
          Email = @email,
          Telefono = @telefono
        WHERE UsuarioID = @usuarioID
      `)

    return NextResponse.json({ message: "Perfil actualizado exitosamente" })
  } catch (error) {
    console.error("Error al actualizar perfil del entrenador:", error)
    return NextResponse.json({ error: "Error al actualizar perfil del entrenador" }, { status: 500 })
  }
}
