// /api/entrenador/socios/perfil/[socioID]/route.ts
import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"

export async function GET(
  request: Request,
  // Ya no necesitamos el parámetro 'context' / '{ params }'
) {
  try {
    // **WORKAROUND CLAVE:** Extraer el ID directamente de la URL de la petición.
    const url = new URL(request.url);
    // El último segmento del pathname es el ID del socio (ej: /api/.../15 -> '15')
    const socioID = url.pathname.split('/').pop(); 

    if (!socioID || isNaN(Number(socioID))) {
      // Este es el error 400 que estás viendo si la URL no termina en un número válido
      return NextResponse.json({ error: "SocioID inválido" }, { status: 400 })
    }

    const pool = await getConnection()

    // 1. Obtener Datos Principales del Socio
    const socioResult = await pool
      .request()
      .input("SocioID", sql.Int, socioID)
      .query(`
        SELECT 
          s.SocioID, s.RUT, s.Nombre, s.Apellido, s.FechaNacimiento, s.Email, 
          s.Telefono, s.Direccion, s.EstadoSocio, s.FechaRegistro, 
          s.FotoURL, s.ContactoEmergencia, s.TelefonoEmergencia, s.CodigoQR
        FROM Socios s
        WHERE s.SocioID = @SocioID
      `)

    if (socioResult.recordset.length === 0) {
      return NextResponse.json({ error: "Socio no encontrado" }, { status: 404 })
    }
    const socioData = socioResult.recordset[0]

    // 2. Obtener Membresía Vigente (la más reciente)
    const membresiaResult = await pool
      .request()
      .input("SocioID", sql.Int, socioID)
      .query(`
        SELECT TOP 1
          mem.MembresíaID, mem.FechaInicio, mem.FechaVencimiento, mem.Estado, 
          mem.MontoPagado, pm.NombrePlan, pm.Precio, pm.DuracionDias, pm.Beneficios
        FROM Membresías mem
        INNER JOIN PlanesMembresía pm ON mem.PlanID = pm.PlanID
        WHERE mem.SocioID = @SocioID
        ORDER BY mem.FechaVencimiento DESC, mem.FechaCreacion DESC
      `)
    const membresiaData = membresiaResult.recordset[0] || null

    // 3. Obtener Historial de Pagos (últimos 10)
    const pagosResult = await pool
      .request()
      .input("SocioID", sql.Int, socioID)
      .query(`
        SELECT TOP 10
          p.MontoPago, p.FechaPago, p.MedioPago, p.Concepto, 
          u.Nombre + ' ' + u.Apellido as UsuarioRegistro
        FROM Pagos p
        LEFT JOIN Usuarios u ON p.UsuarioRegistro = u.UsuarioID
        WHERE p.SocioID = @SocioID
        ORDER BY p.FechaPago DESC
      `)
    const historialPagos = pagosResult.recordset

    // 4. Obtener Historial de Reservas de Clases (últimas 10)
    const reservasResult = await pool
      .request()
      .input("SocioID", sql.Int, socioID)
      .query(`
        SELECT TOP 10
          rc.FechaClase, rc.Estado, rc.FechaReserva,
          c.NombreClase, 
          u.Nombre + ' ' + u.Apellido as NombreEntrenador
        FROM ReservasClases rc
        INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
        INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE rc.SocioID = @SocioID
        ORDER BY rc.FechaClase DESC, rc.FechaReserva DESC
      `)
    const historialReservas = reservasResult.recordset

    return NextResponse.json({
      ...socioData,
      membresiaVigente: membresiaData,
      historialPagos: historialPagos,
      historialReservas: historialReservas,
    })
  } catch (error) {
    console.error("Error al obtener perfil del socio:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}