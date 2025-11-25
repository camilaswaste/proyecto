import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        s.SocioID,
        s.RUT,
        s.Nombre,
        s.Apellido,
        s.Email,
        s.Telefono,
        s.FechaNacimiento,
        s.Direccion,
        s.CodigoQR,
        s.FechaRegistro,
        s.EstadoSocio,
        m.NombrePlan,
        mem.FechaInicio,
        mem.FechaVencimiento as FechaFin,
        mem.Estado as EstadoMembresia
      FROM Socios s
      LEFT JOIN Membresías mem ON s.SocioID = mem.SocioID AND mem.Estado = 'Vigente'
      LEFT JOIN PlanesMembresía m ON mem.PlanID = m.PlanID
      WHERE s.EstadoSocio != 'Inactivo'
      ORDER BY s.FechaRegistro DESC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener socios:", error)
    return NextResponse.json({ error: "Error al obtener socios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { RUT, Nombre, Apellido, Email, Telefono, FechaNacimiento, Direccion } = body

    const pool = await getConnection()

    const codigoQR = `QR-${RUT}-${Date.now()}`

    const tempPassword = `${Nombre.toLowerCase()}123`
    const hashedPassword = await hashPassword(tempPassword)

    const checkColumnQuery = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Socios' AND COLUMN_NAME = 'RequiereCambioPassword'
    `)

    const hasRequiereCambioPassword = checkColumnQuery.recordset.length > 0

    if (hasRequiereCambioPassword) {
      await pool
        .request()
        .input("rut", RUT)
        .input("nombre", Nombre)
        .input("apellido", Apellido)
        .input("email", Email)
        .input("telefono", Telefono || null)
        .input("fechaNacimiento", FechaNacimiento || null)
        .input("direccion", Direccion || null)
        .input("codigoQR", codigoQR)
        .input("passwordHash", hashedPassword)
        .input("estadoSocio", "Activo")
        .input("requiereCambioPassword", true)
        .query(`
          INSERT INTO Socios (RUT, Nombre, Apellido, Email, Telefono, FechaNacimiento, Direccion, CodigoQR, PasswordHash, EstadoSocio, FechaRegistro, RequiereCambioPassword)
          VALUES (@rut, @nombre, @apellido, @email, @telefono, @fechaNacimiento, @direccion, @codigoQR, @passwordHash, @estadoSocio, GETDATE(), @requiereCambioPassword)
        `)
    } else {
      await pool
        .request()
        .input("rut", RUT)
        .input("nombre", Nombre)
        .input("apellido", Apellido)
        .input("email", Email)
        .input("telefono", Telefono || null)
        .input("fechaNacimiento", FechaNacimiento || null)
        .input("direccion", Direccion || null)
        .input("codigoQR", codigoQR)
        .input("passwordHash", hashedPassword)
        .input("estadoSocio", "Activo")
        .query(`
          INSERT INTO Socios (RUT, Nombre, Apellido, Email, Telefono, FechaNacimiento, Direccion, CodigoQR, PasswordHash, EstadoSocio, FechaRegistro)
          VALUES (@rut, @nombre, @apellido, @email, @telefono, @fechaNacimiento, @direccion, @codigoQR, @passwordHash, @estadoSocio, GETDATE())
        `)
    }

    return NextResponse.json({
      success: true,
      message: "Socio creado exitosamente",
      tempPassword: tempPassword,
    })
  } catch (error) {
    console.error("Error al crear socio:", error)
    return NextResponse.json({ error: "Error al crear socio" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { socioID, RUT, Nombre, Apellido, Email, Telefono, FechaNacimiento, Direccion, EstadoSocio } = body

    const pool = await getConnection()

    await pool
      .request()
      .input("socioID", socioID)
      .input("rut", RUT)
      .input("nombre", Nombre)
      .input("apellido", Apellido)
      .input("email", Email)
      .input("telefono", Telefono)
      .input("fechaNacimiento", FechaNacimiento)
      .input("direccion", Direccion)
      .input("estadoSocio", EstadoSocio)
      .query(`
        UPDATE Socios
        SET RUT = @rut, Nombre = @nombre, Apellido = @apellido, Email = @email, 
            Telefono = @telefono, FechaNacimiento = @fechaNacimiento, Direccion = @direccion, EstadoSocio = @estadoSocio
        WHERE SocioID = @socioID
      `)

    return NextResponse.json({ success: true, message: "Socio actualizado exitosamente" })
  } catch (error) {
    console.error("Error al actualizar socio:", error)
    return NextResponse.json({ error: "Error al actualizar socio" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const socioID = searchParams.get("id")

    if (!socioID) {
      return NextResponse.json({ error: "SocioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("socioID", socioID)
      .query(`
        UPDATE Socios
        SET EstadoSocio = 'Inactivo'
        WHERE SocioID = @socioID
      `)

    return NextResponse.json({ success: true, message: "Socio eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar socio:", error)
    return NextResponse.json({ error: "Error al eliminar socio" }, { status: 500 })
  }
}
