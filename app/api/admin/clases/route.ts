import { getConnection } from "@/lib/db"
import { crearNotificacion } from "@/lib/notifications"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        c.ClaseID,
        c.NombreClase,
        c.Descripcion,
        c.EntrenadorID,
        CONCAT(u.Nombre, ' ', u.Apellido) as NombreEntrenador,
        c.DiaSemana,
        c.HoraInicio,
        c.HoraFin,
        c.CupoMaximo,
        c.Activa as Estado,
        c.FechaCreacion,
        c.FechaInicio,
        c.FechaFin,
        c.Categoria,
        (SELECT COUNT(*) 
         FROM ReservasClases r 
         WHERE r.ClaseID = c.ClaseID 
           AND r.Estado != 'Cancelada'
           AND r.FechaClase >= CAST(GETDATE() AS DATE)
        ) AS CuposOcupados
      FROM Clases c
      INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE c.Activa = 1
      ORDER BY c.DiaSemana, c.HoraInicio ASC
    `)

    const groupedClases = result.recordset.reduce((acc: any[], clase: any) => {
      const existing = acc.find(
        (c) =>
          c.NombreClase === clase.NombreClase &&
          c.HoraInicio === clase.HoraInicio &&
          c.HoraFin === clase.HoraFin &&
          c.EntrenadorID === clase.EntrenadorID &&
          c.FechaInicio === clase.FechaInicio &&
          c.FechaFin === clase.FechaFin,
      )

      if (existing) {
        existing.DiasSemana.push(clase.DiaSemana)
        existing.ClaseIDs.push(clase.ClaseID)
        existing.CuposOcupados = (existing.CuposOcupados || 0) + (clase.CuposOcupados || 0)
      } else {
        acc.push({
          ...clase,
          DiasSemana: [clase.DiaSemana],
          ClaseIDs: [clase.ClaseID],
          CuposOcupados: clase.CuposOcupados || 0,
        })
      }

      return acc
    }, [])

    return NextResponse.json(groupedClases)
  } catch (error) {
    console.error("Error al obtener clases:", error)
    return NextResponse.json({ error: "Error al obtener clases" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      NombreClase,
      Descripcion,
      EntrenadorID,
      DiasSemana,
      HoraInicio,
      HoraFin,
      CupoMaximo,
      FechaInicio,
      FechaFin,
      Categoria,
    } = body

    if (
      !NombreClase ||
      !EntrenadorID ||
      !DiasSemana ||
      DiasSemana.length === 0 ||
      !HoraInicio ||
      !HoraFin ||
      !CupoMaximo ||
      !FechaInicio ||
      !FechaFin
    ) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    if (new Date(FechaFin) <= new Date(FechaInicio)) {
      return NextResponse.json({ error: "La fecha de fin debe ser posterior a la fecha de inicio" }, { status: 400 })
    }

    const pool = await getConnection()

    for (const dia of DiasSemana) {
      const conflictoClase = await pool
        .request()
        .input("DiaSemana", dia)
        .input("HoraInicio", HoraInicio)
        .input("HoraFin", HoraFin)
        .input("FechaInicio", FechaInicio)
        .input("FechaFin", FechaFin)
        .query(`
          SELECT COUNT(*) as Conflictos
          FROM Clases
          WHERE DiaSemana = @DiaSemana
            AND Activa = 1
            AND (
              (@HoraInicio >= HoraInicio AND @HoraInicio < HoraFin) OR
              (@HoraFin > HoraInicio AND @HoraFin <= HoraFin) OR
              (@HoraInicio <= HoraInicio AND @HoraFin >= HoraFin)
            )
            AND (
              (@FechaInicio <= FechaFin AND @FechaFin >= FechaInicio)
            )
        `)

      if (conflictoClase.recordset[0].Conflictos > 0) {
        return NextResponse.json(
          { error: `Ya existe una clase el ${dia} en ese horario para las fechas seleccionadas` },
          { status: 409 },
        )
      }
    }

    for (const dia of DiasSemana) {
      await pool
        .request()
        .input("NombreClase", NombreClase)
        .input("Descripcion", Descripcion || null)
        .input("EntrenadorID", EntrenadorID)
        .input("DiaSemana", dia)
        .input("HoraInicio", HoraInicio)
        .input("HoraFin", HoraFin)
        .input("CupoMaximo", CupoMaximo)
        .input("FechaInicio", FechaInicio)
        .input("FechaFin", FechaFin)
        .input("Categoria", Categoria || null)
        .query(`
          INSERT INTO Clases (NombreClase, Descripcion, EntrenadorID, DiaSemana, HoraInicio, HoraFin, CupoMaximo, Activa, FechaInicio, FechaFin, Categoria)
          VALUES (@NombreClase, @Descripcion, @EntrenadorID, @DiaSemana, @HoraInicio, @HoraFin, @CupoMaximo, 1, @FechaInicio, @FechaFin, @Categoria)
        `)
    }

    try {
      await crearNotificacion({
        tipoUsuario: "Entrenador",
        usuarioID: EntrenadorID,
        tipoEvento: "clase_creada",
        titulo: "Nueva clase asignada",
        mensaje: `Se te ha asignado la clase "${NombreClase}" los días ${DiasSemana.join(", ")} de ${HoraInicio} a ${HoraFin}.`,
      })
    } catch (notifError) {
      console.error("Error al enviar notificaciones (no crítico):", notifError)
    }

    return NextResponse.json({ message: "Clase(s) creada(s) exitosamente" }, { status: 201 })
  } catch (error) {
    console.error("Error al crear clase:", error)
    return NextResponse.json({ error: "Error al crear clase" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const body = await request.json()
    const {
      NombreClase,
      Descripcion,
      EntrenadorID,
      DiasSemana,
      HoraInicio,
      HoraFin,
      CupoMaximo,
      FechaInicio,
      FechaFin,
      Categoria,
    } = body

    if (!id) {
      return NextResponse.json({ error: "ID de clase requerido" }, { status: 400 })
    }

    if (!DiasSemana || DiasSemana.length === 0) {
      return NextResponse.json({ error: "Debe seleccionar al menos un día" }, { status: 400 })
    }

    if (!FechaInicio || !FechaFin) {
      return NextResponse.json({ error: "Debe especificar las fechas de inicio y fin" }, { status: 400 })
    }

    if (new Date(FechaFin) <= new Date(FechaInicio)) {
      return NextResponse.json({ error: "La fecha de fin debe ser posterior a la fecha de inicio" }, { status: 400 })
    }

    const pool = await getConnection()

    const claseOriginal = await pool
      .request()
      .input("ClaseID", id)
      .query(`
        SELECT 
          NombreClase, 
          CONVERT(VARCHAR(8), HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(8), HoraFin, 108) as HoraFin,
          EntrenadorID,
          FechaInicio,
          FechaFin
        FROM Clases
        WHERE ClaseID = @ClaseID
      `)

    if (claseOriginal.recordset.length === 0) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })
    }

    const claseInfo = claseOriginal.recordset[0]

    await pool
      .request()
      .input("NombreClase", claseInfo.NombreClase)
      .input("HoraInicio", claseInfo.HoraInicio)
      .input("HoraFin", claseInfo.HoraFin)
      .input("EntrenadorID", claseInfo.EntrenadorID)
      .input("FechaInicio", claseInfo.FechaInicio)
      .input("FechaFin", claseInfo.FechaFin)
      .query(`
        DELETE FROM Clases
        WHERE NombreClase = @NombreClase
          AND CONVERT(VARCHAR(8), HoraInicio, 108) = @HoraInicio
          AND CONVERT(VARCHAR(8), HoraFin, 108) = @HoraFin
          AND EntrenadorID = @EntrenadorID
          AND FechaInicio = @FechaInicio
          AND FechaFin = @FechaFin
      `)

    for (const dia of DiasSemana) {
      const conflictoClase = await pool
        .request()
        .input("DiaSemana", dia)
        .input("HoraInicio", HoraInicio)
        .input("HoraFin", HoraFin)
        .input("FechaInicio", FechaInicio)
        .input("FechaFin", FechaFin)
        .query(`
          SELECT COUNT(*) as Conflictos
          FROM Clases
          WHERE DiaSemana = @DiaSemana
            AND Activa = 1
            AND (
              (@HoraInicio >= CONVERT(VARCHAR(8), HoraInicio, 108) AND @HoraInicio < CONVERT(VARCHAR(8), HoraFin, 108)) OR
              (@HoraFin > CONVERT(VARCHAR(8), HoraInicio, 108) AND @HoraFin <= CONVERT(VARCHAR(8), HoraFin, 108)) OR
              (@HoraInicio <= CONVERT(VARCHAR(8), HoraInicio, 108) AND @HoraFin >= CONVERT(VARCHAR(8), HoraFin, 108))
            )
            AND (
              (@FechaInicio <= FechaFin AND @FechaFin >= FechaInicio)
            )
        `)

      if (conflictoClase.recordset[0].Conflictos > 0) {
        return NextResponse.json(
          { error: `Ya existe una clase el ${dia} en ese horario para las fechas seleccionadas` },
          { status: 409 },
        )
      }
    }

    for (const dia of DiasSemana) {
      await pool
        .request()
        .input("NombreClase", NombreClase)
        .input("Descripcion", Descripcion || null)
        .input("EntrenadorID", EntrenadorID)
        .input("DiaSemana", dia)
        .input("HoraInicio", HoraInicio)
        .input("HoraFin", HoraFin)
        .input("CupoMaximo", CupoMaximo)
        .input("FechaInicio", FechaInicio)
        .input("FechaFin", FechaFin)
        .input("Categoria", Categoria || null)
        .query(`
          INSERT INTO Clases (NombreClase, Descripcion, EntrenadorID, DiaSemana, HoraInicio, HoraFin, CupoMaximo, Activa, FechaInicio, FechaFin, Categoria)
          VALUES (@NombreClase, @Descripcion, @EntrenadorID, @DiaSemana, @HoraInicio, @HoraFin, @CupoMaximo, 1, @FechaInicio, @FechaFin, @Categoria)
        `)
    }

    return NextResponse.json({ message: "Clase actualizada exitosamente" })
  } catch (error) {
    console.error("Error al actualizar clase:", error)
    return NextResponse.json({ error: "Error al actualizar clase" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID de clase requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const claseInfo = await pool
      .request()
      .input("ClaseID", id)
      .query(`
        SELECT c.NombreClase, c.DiaSemana, c.HoraInicio, c.HoraFin, c.EntrenadorID
        FROM Clases c
        WHERE c.ClaseID = @ClaseID
      `)

    const clase = claseInfo.recordset[0]

    await pool
      .request()
      .input("ClaseID", id)
      .query(`
        DELETE FROM ReservasClases
        WHERE ClaseID = @ClaseID
      `)

    await pool
      .request()
      .input("ClaseID", id)
      .query(`
        DELETE FROM Clases
        WHERE ClaseID = @ClaseID
      `)

    try {
      await crearNotificacion({
        tipoUsuario: "Entrenador",
        usuarioID: clase.EntrenadorID,
        tipoEvento: "clase_eliminada",
        titulo: "Clase eliminada",
        mensaje: `Se ha eliminado la clase "${clase.NombreClase}" del ${clase.DiaSemana} de ${clase.HoraInicio} a ${clase.HoraFin}.`,
      })
    } catch (notifError) {
      console.error("Error al enviar notificaciones (no crítico):", notifError)
    }

    return NextResponse.json({ message: "Clase eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar clase:", error)
    return NextResponse.json({ error: "Error al eliminar clase" }, { status: 500 })
  }
}
