import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, rut, excludeId, userType } = await request.json()

    // Validate at least one field is provided
    if (!email && !rut) {
      return NextResponse.json({ error: "Debe proporcionar email o RUT para validar" }, { status: 400 })
    }

    const pool = await getConnection()
    const errors: string[] = []

    // Check email uniqueness
    if (email) {
      // Check in Usuarios table
      let usuariosQuery = `SELECT COUNT(*) as count FROM Usuarios WHERE Email = @email`
      const usuariosRequest = pool.request().input("email", email)

      if (excludeId && userType !== "Socio") {
        usuariosQuery += ` AND UsuarioID != @excludeId`
        usuariosRequest.input("excludeId", excludeId)
      }

      const usuariosResult = await usuariosRequest.query(usuariosQuery)

      // Check in Socios table
      let sociosQuery = `SELECT COUNT(*) as count FROM Socios WHERE Email = @email`
      const sociosRequest = pool.request().input("email", email)

      if (excludeId && userType === "Socio") {
        sociosQuery += ` AND SocioID != @excludeId`
        sociosRequest.input("excludeId", excludeId)
      }

      const sociosResult = await sociosRequest.query(sociosQuery)

      if (usuariosResult.recordset[0].count > 0 || sociosResult.recordset[0].count > 0) {
        errors.push("El email ya está registrado en el sistema")
      }
    }

    // Check RUT uniqueness (only in Socios table)
    if (rut) {
      let rutQuery = `SELECT COUNT(*) as count FROM Socios WHERE RUT = @rut`
      const rutRequest = pool.request().input("rut", rut)

      if (excludeId && userType === "Socio") {
        rutQuery += ` AND SocioID != @excludeId`
        rutRequest.input("excludeId", excludeId)
      }

      const rutResult = await rutRequest.query(rutQuery)

      if (rutResult.recordset[0].count > 0) {
        errors.push("El RUT ya está registrado en el sistema")
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ valid: false, errors }, { status: 200 })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Error validating account:", error)
    return NextResponse.json({ error: "Error al validar la cuenta" }, { status: 500 })
  }
}
