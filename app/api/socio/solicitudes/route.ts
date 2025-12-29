import { getUser } from "@/lib/auth-server"
import { getConnection, sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

// GET - Obtener solicitudes del socio
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.rol !== "Socio") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const socioID = user.socioID || user.usuarioID

    const pool = await getConnection()
    const result = await pool
      .request()
      .input("socioID", sql.Int, socioID)
      .query(`
        SELECT 
          SolicitudID,
          TipoSolicitud,
          MesesPausa,
          MotivoCancelacion,
          MotivoSolicitud,
          Estado,
          FechaSolicitud,
          FechaRespuesta,
          MotivoRechazo,
          PlanNuevoID,
          TipoCambio
        FROM SolicitudesMembresia
        WHERE SocioID = @socioID
        ORDER BY FechaSolicitud DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener solicitudes:", error)
    return NextResponse.json({ error: "Error al obtener solicitudes" }, { status: 500 })
  }
}

// POST - Crear nueva solicitud
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.rol !== "Socio") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const socioID = user.socioID || user.usuarioID
    const body = await request.json()
    const { tipoSolicitud, mesesPausa, motivoCancelacion, motivoSolicitud, planNuevoID, tipoCambio } = body

    console.log("[v0] Received body:", body)
    console.log("[v0] TipoSolicitud value:", tipoSolicitud)

    // Validaciones
    if (
      !tipoSolicitud ||
      !["Pausar", "Cancelar", "Activar", "Cambiar", "Reanudar", "Asignar"].includes(tipoSolicitud)
    ) {
      console.log("[v0] Validation failed - invalid tipo")
      return NextResponse.json({ error: "Tipo de solicitud inválido" }, { status: 400 })
    }

    if (tipoSolicitud === "Pausar" && (!mesesPausa || ![1, 2, 3].includes(mesesPausa))) {
      return NextResponse.json({ error: "Debe especificar 1, 2 o 3 meses para pausar" }, { status: 400 })
    }

    if (tipoSolicitud === "Cancelar" && !motivoCancelacion) {
      return NextResponse.json({ error: "Debe especificar un motivo de cancelación" }, { status: 400 })
    }

    if ((tipoSolicitud === "Cambiar" || tipoSolicitud === "Asignar") && !planNuevoID) {
      return NextResponse.json({ error: "Debe especificar el plan deseado" }, { status: 400 })
    }

    if (tipoSolicitud === "Cambiar" && !tipoCambio) {
      return NextResponse.json({ error: "Debe especificar el tipo de cambio" }, { status: 400 })
    }

    const pool = await getConnection()

    // Verificar que no tenga solicitudes pendientes del mismo tipo
    const existingRequest = await pool
      .request()
      .input("socioID", sql.Int, socioID)
      .input("tipoSolicitud", sql.NVarChar, tipoSolicitud)
      .query(`
        SELECT SolicitudID 
        FROM SolicitudesMembresia 
        WHERE SocioID = @socioID 
          AND TipoSolicitud = @tipoSolicitud 
          AND Estado = 'Pendiente'
      `)

    if (existingRequest.recordset.length > 0) {
      return NextResponse.json(
        { error: `Ya tienes una solicitud pendiente para ${tipoSolicitud.toLowerCase()} tu membresía` },
        { status: 400 },
      )
    }

    // Crear la solicitud
    await pool
      .request()
      .input("socioID", sql.Int, socioID)
      .input("tipoSolicitud", sql.NVarChar, tipoSolicitud)
      .input("mesesPausa", sql.Int, mesesPausa || null)
      .input("motivoCancelacion", sql.NVarChar, motivoCancelacion || null)
      .input("motivoSolicitud", sql.NVarChar, motivoSolicitud || null)
      .input("planNuevoID", sql.Int, planNuevoID || null)
      .input("tipoCambio", sql.NVarChar, tipoCambio || null)
      .query(`
        INSERT INTO SolicitudesMembresia (
          SocioID, 
          TipoSolicitud, 
          MesesPausa, 
          MotivoCancelacion, 
          MotivoSolicitud,
          PlanNuevoID,
          TipoCambio
        )
        VALUES (
          @socioID, 
          @tipoSolicitud, 
          @mesesPausa, 
          @motivoCancelacion, 
          @motivoSolicitud,
          @planNuevoID,
          @tipoCambio
        )
      `)

    return NextResponse.json({ message: "Solicitud enviada exitosamente" })
  } catch (error) {
    console.error("Error al crear solicitud:", error)
    return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 })
  }
}
