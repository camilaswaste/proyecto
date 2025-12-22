import { getConnection } from "@/lib/db"
import bcrypt from "bcryptjs"
import sql from "mssql"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const socioID = searchParams.get("socioID")

    if (!socioID) {
      return NextResponse.json({ error: "SocioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("socioID", sql.Int, Number.parseInt(socioID))
      .query(`
        SELECT 
          SocioID,
          Nombre,
          Apellido,
          RUT,
          Email,
          Telefono,
          FotoURL
        FROM Socios
        WHERE SocioID = @socioID
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("[v0] Error al obtener perfil del socio:", error)
    return NextResponse.json({ error: "Error al obtener perfil del socio" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { socioID, nombre, apellido, email, telefono, currentPassword, newPassword } = body

    if (!socioID) {
      return NextResponse.json({ error: "SocioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    // Si se está cambiando la contraseña
    if (currentPassword && newPassword) {
      const userResult = await pool
        .request()
        .input("socioID", sql.Int, socioID)
        .query(`SELECT PasswordHash FROM Socios WHERE SocioID = @socioID`)

      if (userResult.recordset.length === 0) {
        return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, userResult.recordset[0].PasswordHash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 })
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      await pool
        .request()
        .input("socioID", sql.Int, socioID)
        .input("passwordHash", sql.NVarChar, newPasswordHash)
        .query(`UPDATE Socios SET PasswordHash = @passwordHash WHERE SocioID = @socioID`)

      return NextResponse.json({ message: "Contraseña actualizada exitosamente" })
    }

    await pool
      .request()
      .input("socioID", sql.Int, socioID)
      .input("nombre", sql.NVarChar, nombre)
      .input("apellido", sql.NVarChar, apellido)
      .input("email", sql.NVarChar, email)
      .input("telefono", sql.NVarChar, telefono || null)
      .query(`
        UPDATE Socios
        SET 
          Nombre = @nombre,
          Apellido = @apellido,
          Email = @email,
          Telefono = @telefono
        WHERE SocioID = @socioID
      `)

    return NextResponse.json({ message: "Perfil actualizado exitosamente" })
  } catch (error) {
    console.error("Error al actualizar perfil del socio:", error)
    return NextResponse.json({ error: "Error al actualizar perfil del socio" }, { status: 500 })
  }
}
