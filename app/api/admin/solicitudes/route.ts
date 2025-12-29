import { getUser } from "@/lib/auth-server"
import { getConnection, sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

// GET - Obtener todas las solicitudes pendientes
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.rol !== "Administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") || "Pendiente"

    const pool = await getConnection()
    const result = await pool
      .request()
      .input("estado", sql.NVarChar, estado)
      .query(`
        SELECT 
          s.SolicitudID,
          s.SocioID,
          s.TipoSolicitud,
          s.MesesPausa,
          s.MotivoCancelacion,
          s.MotivoSolicitud,
          s.Estado,
          s.FechaSolicitud,
          s.FechaRespuesta,
          s.MotivoRechazo,
          so.Nombre,
          so.Apellido,
          so.Email,
          so.RUT,
          u.Nombre + ' ' + u.Apellido AS AdminRespuesta
        FROM SolicitudesMembresia s
        INNER JOIN Socios so ON s.SocioID = so.SocioID
        LEFT JOIN Usuarios u ON s.AdminRespuestaID = u.UsuarioID
        WHERE s.Estado = @estado
        ORDER BY s.FechaSolicitud DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener solicitudes:", error)
    return NextResponse.json({ error: "Error al obtener solicitudes" }, { status: 500 })
  }
}

// PUT - Aprobar o rechazar solicitud
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.rol !== "Administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { solicitudID, accion, motivoRechazo } = body

    if (!solicitudID || !accion || !["aprobar", "rechazar"].includes(accion)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    if (accion === "rechazar" && !motivoRechazo) {
      return NextResponse.json({ error: "Debe proporcionar un motivo de rechazo" }, { status: 400 })
    }

    const pool = await getConnection()

    // Obtener la solicitud
    const solicitudResult = await pool
      .request()
      .input("solicitudID", sql.Int, solicitudID)
      .query(`
        SELECT 
          s.SolicitudID,
          s.SocioID,
          s.TipoSolicitud,
          s.MesesPausa,
          s.MotivoCancelacion,
          s.Estado,
          m.MembresíaID
        FROM SolicitudesMembresia s
        LEFT JOIN Membresías m ON s.SocioID = m.SocioID 
          AND m.Estado IN ('Vigente', 'Suspendida')
        WHERE s.SolicitudID = @solicitudID
      `)

    if (solicitudResult.recordset.length === 0) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    const solicitud = solicitudResult.recordset[0]

    if (solicitud.Estado !== "Pendiente") {
      return NextResponse.json({ error: "Esta solicitud ya fue procesada" }, { status: 400 })
    }

    if (accion === "aprobar") {
      // Ejecutar la acción correspondiente
      if (solicitud.TipoSolicitud === "Pausar") {
        const diasPausa = (solicitud.MesesPausa || 1) * 30

        await pool
          .request()
          .input("socioID", sql.Int, solicitud.SocioID)
          .input("dias", sql.Int, diasPausa)
          .query(`
            UPDATE Membresías
            SET Estado = 'Suspendida',
                FechaVencimiento = DATEADD(DAY, @dias, FechaVencimiento)
            WHERE SocioID = @socioID 
              AND Estado = 'Vigente'
          `)
      } else if (solicitud.TipoSolicitud === "Cancelar") {
        await pool
          .request()
          .input("socioID", sql.Int, solicitud.SocioID)
          .query(`
            UPDATE Membresías
            SET Estado = 'Cancelada'
            WHERE SocioID = @socioID 
              AND Estado IN ('Vigente', 'Suspendida')
          `)
      } else if (solicitud.TipoSolicitud === "Activar") {
        await pool
          .request()
          .input("socioID", sql.Int, solicitud.SocioID)
          .query(`
            UPDATE Membresías
            SET Estado = 'Vigente'
            WHERE SocioID = @socioID 
              AND Estado = 'Suspendida'
          `)
      }

      // Actualizar la solicitud como aprobada
      await pool
        .request()
        .input("solicitudID", sql.Int, solicitudID)
        .input("adminID", sql.Int, user.usuarioID)
        .query(`
          UPDATE SolicitudesMembresia
          SET Estado = 'Aprobada',
              FechaRespuesta = GETDATE(),
              AdminRespuestaID = @adminID
          WHERE SolicitudID = @solicitudID
        `)

      return NextResponse.json({ message: "Solicitud aprobada y procesada exitosamente" })
    } else {
      // Rechazar la solicitud
      await pool
        .request()
        .input("solicitudID", sql.Int, solicitudID)
        .input("adminID", sql.Int, user.usuarioID)
        .input("motivoRechazo", sql.NVarChar, motivoRechazo)
        .query(`
          UPDATE SolicitudesMembresia
          SET Estado = 'Rechazada',
              FechaRespuesta = GETDATE(),
              AdminRespuestaID = @adminID,
              MotivoRechazo = @motivoRechazo
          WHERE SolicitudID = @solicitudID
        `)

      return NextResponse.json({ message: "Solicitud rechazada" })
    }
  } catch (error) {
    console.error("Error al procesar solicitud:", error)
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 })
  }
}
