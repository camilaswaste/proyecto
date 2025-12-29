import { getConnection } from "@/lib/db"

export type TipoEvento =
  | "clase_creada"
  | "clase_eliminada"
  | "sesion_agendada"
  | "sesion_cancelada_socio"
  | "sesion_cancelada_entrenador"
  | "intercambio_solicitado"
  | "intercambio_aprobado"
  | "intercambio_rechazado"
  | "recepcion_asignada"
  | "inscripcion_clase"
  | "membresia_asignada"
  | "membresia_actualizada"
  | "pago_registrado"
  | "plan_promocional"
  | "aviso_general"

interface NotificacionParams {
  tipoUsuario: "Admin" | "Entrenador" | "Socio"
  usuarioID?: number
  tipoEvento: TipoEvento
  titulo: string
  mensaje: string
}

export async function crearNotificacion(params: NotificacionParams) {
  const pool = await getConnection()

  try {
    if (params.tipoUsuario === "Socio" && !params.usuarioID) {
      // Obtener todos los socios activos
      const sociosResult = await pool.request().query(`
        SELECT SocioID
        FROM Socios
        WHERE EstadoSocio = 'Activo'
      `)

      console.log(`[v0] Creando notificación para ${sociosResult.recordset.length} socios activos`)

      // Crear una notificación para cada socio
      for (const socio of sociosResult.recordset) {
        await pool
          .request()
          .input("tipoUsuario", params.tipoUsuario)
          .input("usuarioID", socio.SocioID)
          .input("tipoEvento", params.tipoEvento)
          .input("titulo", params.titulo)
          .input("mensaje", params.mensaje)
          .query(`
            INSERT INTO Notificaciones (TipoUsuario, UsuarioID, TipoEvento, Titulo, Mensaje)
            VALUES (@tipoUsuario, @usuarioID, @tipoEvento, @titulo, @mensaje)
          `)
      }

      console.log(`[v0] Notificación broadcast creada para todos los socios:`, params.titulo)
      return
    }

    await pool
      .request()
      .input("tipoUsuario", params.tipoUsuario)
      .input("usuarioID", params.usuarioID || null)
      .input("tipoEvento", params.tipoEvento)
      .input("titulo", params.titulo)
      .input("mensaje", params.mensaje)
      .query(`
        INSERT INTO Notificaciones (TipoUsuario, UsuarioID, TipoEvento, Titulo, Mensaje)
        VALUES (@tipoUsuario, @usuarioID, @tipoEvento, @titulo, @mensaje)
      `)

    // Solo ejecutar limpieza de forma aleatoria (10% de las veces) para reducir carga
    if (Math.random() < 0.1) {
      setImmediate(async () => {
        try {
          const cleanupPool = await getConnection()
          if (params.usuarioID) {
            await cleanupPool
              .request()
              .input("tipoUsuario", params.tipoUsuario)
              .input("usuarioID", params.usuarioID)
              .query(`
                DELETE FROM Notificaciones
                WHERE NotificacionID IN (
                  SELECT TOP 1000 NotificacionID
                  FROM Notificaciones
                  WHERE TipoUsuario = @tipoUsuario AND UsuarioID = @usuarioID
                  ORDER BY FechaCreacion DESC
                  OFFSET 100 ROWS
                )
              `)
          } else {
            await cleanupPool
              .request()
              .input("tipoUsuario", params.tipoUsuario)
              .query(`
                DELETE FROM Notificaciones
                WHERE NotificacionID IN (
                  SELECT TOP 1000 NotificacionID
                  FROM Notificaciones
                  WHERE TipoUsuario = @tipoUsuario AND UsuarioID IS NULL
                  ORDER BY FechaCreacion DESC
                  OFFSET 100 ROWS
                )
              `)
          }
        } catch (cleanupError) {
          console.error("[v0] Error en limpieza de notificaciones (no crítico):", cleanupError)
        }
      })
    }

    console.log("[v0] Notificación creada:", params.titulo)
  } catch (error) {
    console.error("[v0] Error crítico en notificaciones:", error)
    throw error
  }
}
