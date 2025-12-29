import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"

const parseTimeToDate = (timeString: string) => {
  if (!timeString) return null
  const [hours, minutes] = timeString.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

const getEntrenadorID = async (usuarioID: number) => {
  const pool = await getConnection()
  const result = await pool
    .request()
    .input("UsuarioID", sql.Int, usuarioID)
    .query(`
      SELECT EntrenadorID 
      FROM Entrenadores 
      WHERE UsuarioID = @UsuarioID AND Activo = 1
    `)
  return result.recordset[0]?.EntrenadorID
}

// --- 1. OBTENER TODAS LAS SESIONES (Individuales + Grupales) ---
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const usuarioID = url.searchParams.get("usuarioID")

    if (!usuarioID || isNaN(Number(usuarioID))) {
      return NextResponse.json({ error: "UsuarioID inválido o faltante." }, { status: 400 })
    }

    const entrenadorID = await getEntrenadorID(Number(usuarioID))

    if (!entrenadorID) {
      return NextResponse.json({ error: "No se encontró un perfil de entrenador activo." }, { status: 403 })
    }

    const pool = await getConnection()

    // Obtener sesiones personales
    const sesionesPersonalesResult = await pool
      .request()
      .input("EntrenadorID", sql.Int, entrenadorID)
      .query(`
        SELECT 
          sp.SesionID AS ClaseID,
          sp.SocioID,
          s.Nombre + ' ' + s.Apellido AS NombreSocio,
          CONCAT(s.Nombre, ' ', s.Apellido, ' - Sesión Personal') AS NombreClase,
          sp.Notas AS Descripcion,
          DATENAME(WEEKDAY, sp.FechaSesion) AS DiaSemana,
          CAST(sp.HoraInicio AS TIME) AS HoraInicio,
          CAST(sp.HoraFin AS TIME) AS HoraFin,
          1 AS CupoMaximo,
          CASE WHEN sp.Estado IN ('Agendada', 'Completada') THEN 1 ELSE 0 END AS Activa,
          sp.FechaSesion AS FechaInicio,
          sp.FechaSesion AS FechaFin,
          'Personal' AS Categoria,
          'Personal' AS TipoClase,
          sp.EntrenadorID,
          u.Nombre + ' ' + u.Apellido AS NombreEntrenador,
          CASE WHEN sp.Estado = 'Agendada' THEN 1 ELSE 0 END AS CuposOcupados,
          sp.Estado
        FROM SesionesPersonales sp
        INNER JOIN Socios s ON sp.SocioID = s.SocioID
        INNER JOIN Entrenadores e ON sp.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE sp.EntrenadorID = @EntrenadorID 
        AND sp.Estado IN ('Agendada', 'Completada')
        AND sp.FechaSesion >= CAST(GETDATE() AS DATE)
      `)

    // Obtener clases grupales
    const clasesGrupalesResult = await pool
      .request()
      .input("EntrenadorID", sql.Int, entrenadorID)
      .query(`
        SELECT 
          c.ClaseID, 
          NULL AS SocioID,
          NULL AS NombreSocio,
          c.NombreClase, 
          c.Descripcion, 
          c.DiaSemana, 
          c.HoraInicio, 
          c.HoraFin, 
          c.CupoMaximo, 
          c.Activa AS Estado, 
          c.FechaInicio, 
          c.FechaFin, 
          c.Categoria,
          'Grupal' AS TipoClase,
          e.EntrenadorID, 
          u.Nombre + ' ' + u.Apellido AS NombreEntrenador, 
          (
            SELECT COUNT(ReservaID) 
            FROM ReservasClases 
            WHERE ClaseID = c.ClaseID 
            AND Estado IN ('Reservada', 'Asistió', 'Reprogramada')
          ) AS CuposOcupados,
          NULL AS Estado
        FROM Clases c
        INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE c.EntrenadorID = @EntrenadorID 
        AND c.Activa = 1
        AND (c.FechaFin IS NULL OR c.FechaFin >= CAST(GETDATE() AS DATE))
      `)

    const sesionesPersonales = sesionesPersonalesResult.recordset.map((sesion) => ({
      ...sesion,
      DiaSemana: String(sesion.DiaSemana || "").trim(),
      DiasSemana: [String(sesion.DiaSemana || "").trim()],
    }))

    const clasesGrupales = clasesGrupalesResult.recordset.map((clase) => ({
      ...clase,
      DiaSemana: String(clase.DiaSemana || "").trim(),
      DiasSemana: [String(clase.DiaSemana || "").trim()],
    }))

    // Combinar ambos tipos
    const todasLasSesiones = [...sesionesPersonales, ...clasesGrupales]

    return NextResponse.json(todasLasSesiones)
  } catch (error) {
    console.error("Error al obtener sesiones:", error)
    return NextResponse.json({ error: "Error interno al obtener sesiones." }, { status: 500 })
  }
}

// --- 2. CREAR SESIÓN/CLASE (POST) ---
export async function POST(request: Request) {
  const pool = await getConnection()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()
  try {
    const url = new URL(request.url)
    const usuarioID = url.searchParams.get("usuarioID")
    const body = await request.json()

    const entrenadorID = await getEntrenadorID(Number(usuarioID))
    if (!entrenadorID) {
      await transaction.rollback()
      return NextResponse.json({ error: "No autorizado." }, { status: 403 })
    }

    const {
      NombreClase,
      Descripcion,
      DiaSemana: rawDiaSemana,
      HoraInicio: rawHoraInicio,
      HoraFin: rawHoraFin,
      CupoMaximo: rawCupoMaximo,
      FechaInicio,
      FechaFin,
      Categoria,
      TipoClase,
      SocioID: rawSocioID,
    } = body

    const horaInicioDate = parseTimeToDate(rawHoraInicio)
    const horaFinDate = parseTimeToDate(rawHoraFin)
    const DiaSemana = rawDiaSemana ? String(rawDiaSemana).trim() : null

    const esPersonal = TipoClase === "Personal"

    // **LÓGICA PARA SESIÓN INDIVIDUAL**
    if (esPersonal) {
      const SocioID = Number(rawSocioID)

      if (!SocioID || !FechaInicio || !horaInicioDate || !horaFinDate) {
        await transaction.rollback()
        return NextResponse.json({ error: "Faltan campos obligatorios para sesión personal." }, { status: 400 })
      }

      // Verificar solapamiento en SesionesPersonales
      const overlapCheck = await transaction
        .request()
        .input("EntrenadorID", sql.Int, entrenadorID)
        .input("FechaSesion", sql.Date, FechaInicio)
        .input("HoraInicio", sql.Time, horaInicioDate)
        .input("HoraFin", sql.Time, horaFinDate)
        .query(`
          SELECT TOP 1 SesionID FROM SesionesPersonales
          WHERE EntrenadorID = @EntrenadorID 
          AND FechaSesion = @FechaSesion
          AND Estado IN ('Agendada', 'Completada')
          AND (
            (@HoraInicio >= HoraInicio AND @HoraInicio < HoraFin) OR
            (@HoraFin > HoraInicio AND @HoraFin <= HoraFin) OR
            (HoraInicio >= @HoraInicio AND HoraInicio < @HoraFin)
          )
        `)

      if (overlapCheck.recordset.length > 0) {
        await transaction.rollback()
        return NextResponse.json({ error: "Ya tienes otra sesión programada en este horario." }, { status: 409 })
      }

      // Insertar en SesionesPersonales
      const sesionInsertResult = await transaction
        .request()
        .input("EntrenadorID", sql.Int, entrenadorID)
        .input("SocioID", sql.Int, SocioID)
        .input("FechaSesion", sql.Date, FechaInicio)
        .input("HoraInicio", sql.Time, horaInicioDate)
        .input("HoraFin", sql.Time, horaFinDate)
        .input("Notas", sql.NVarChar, Descripcion || NombreClase)
        .query(`
          INSERT INTO SesionesPersonales (EntrenadorID, SocioID, FechaSesion, HoraInicio, HoraFin, Estado, Notas)
          OUTPUT INSERTED.SesionID
          VALUES (@EntrenadorID, @SocioID, @FechaSesion, @HoraInicio, @HoraFin, 'Agendada', @Notas)
        `)

      const nuevaSesionID = sesionInsertResult.recordset[0]?.SesionID

      await transaction.commit()
      return NextResponse.json(
        { message: "Sesión personal creada con éxito.", ClaseID: nuevaSesionID },
        { status: 201 },
      )
    }

    // **LÓGICA PARA CLASE GRUPAL**
    const CupoMaximo = Number(rawCupoMaximo)

    if (!NombreClase || !DiaSemana || !horaInicioDate || !CupoMaximo || !Categoria) {
      await transaction.rollback()
      return NextResponse.json({ error: "Faltan campos obligatorios para clase grupal." }, { status: 400 })
    }

    // Verificar solapamiento en Clases
    const overlapCheck = await transaction
      .request()
      .input("EntrenadorID", sql.Int, entrenadorID)
      .input("DiaSemana", sql.NVarChar, DiaSemana)
      .input("HoraInicio", sql.Time, horaInicioDate)
      .input("HoraFin", sql.Time, horaFinDate)
      .query(`
        SELECT TOP 1 ClaseID FROM Clases
        WHERE EntrenadorID = @EntrenadorID 
        AND DiaSemana = @DiaSemana
        AND Activa = 1
        AND (
          (@HoraInicio >= HoraInicio AND @HoraInicio < HoraFin) OR
          (@HoraFin > HoraInicio AND @HoraFin <= HoraFin) OR
          (HoraInicio >= @HoraInicio AND HoraInicio < @HoraFin)
        )
      `)

    if (overlapCheck.recordset.length > 0) {
      await transaction.rollback()
      return NextResponse.json({ error: "Ya tienes otra clase programada en este horario." }, { status: 409 })
    }

    const claseInsertResult = await transaction
      .request()
      .input("NombreClase", sql.NVarChar, NombreClase)
      .input("Descripcion", sql.NVarChar, Descripcion)
      .input("EntrenadorID", sql.Int, entrenadorID)
      .input("DiaSemana", sql.NVarChar, DiaSemana)
      .input("HoraInicio", sql.Time, horaInicioDate)
      .input("HoraFin", sql.Time, horaFinDate)
      .input("CupoMaximo", sql.Int, CupoMaximo)
      .input("FechaInicio", sql.Date, FechaInicio)
      .input("FechaFin", sql.Date, FechaFin)
      .input("Categoria", sql.NVarChar, Categoria)
      .query(`
        INSERT INTO Clases (NombreClase, Descripcion, EntrenadorID, DiaSemana, HoraInicio, HoraFin, CupoMaximo, FechaInicio, FechaFin, Activa, Categoria)
        OUTPUT INSERTED.ClaseID
        VALUES (@NombreClase, @Descripcion, @EntrenadorID, @DiaSemana, @HoraInicio, @HoraFin, @CupoMaximo, @FechaInicio, @FechaFin, 1, @Categoria)
      `)

    const nuevaClaseID = claseInsertResult.recordset[0]?.ClaseID

    await transaction.commit()
    return NextResponse.json({ message: "Clase grupal creada con éxito.", ClaseID: nuevaClaseID }, { status: 201 })
  } catch (error) {
    if (transaction) await transaction.rollback()
    console.error("Error al crear sesión/clase:", error)
    return NextResponse.json({ error: "Error al crear en la base de datos." }, { status: 500 })
  }
}

// --- 3. ACTUALIZAR SESIÓN/CLASE (PUT) ---
export async function PUT(request: Request) {
  const transaction = new sql.Transaction(await getConnection())
  await transaction.begin()
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const usuarioID = url.searchParams.get("usuarioID")
    const tipoClase = url.searchParams.get("tipo") // "Personal" o "Grupal"
    const body = await request.json()

    const entrenadorID = await getEntrenadorID(Number(usuarioID))
    if (!entrenadorID) {
      await transaction.rollback()
      return NextResponse.json({ error: "No autorizado." }, { status: 403 })
    }

    const {
      NombreClase,
      Descripcion,
      DiaSemana: rawDiaSemana,
      HoraInicio: rawHoraInicio,
      HoraFin: rawHoraFin,
      CupoMaximo: rawCupoMaximo,
      FechaInicio,
      FechaFin,
      Categoria,
      TipoClase,
      SocioID: rawSocioID,
    } = body

    const horaInicioDate = parseTimeToDate(rawHoraInicio)
    const horaFinDate = parseTimeToDate(rawHoraFin)
    const esPersonal = TipoClase === "Personal" || tipoClase === "Personal"

    // **ACTUALIZAR SESIÓN PERSONAL**
    if (esPersonal) {
      const SocioID = Number(rawSocioID)

      await transaction
        .request()
        .input("SesionID", sql.Int, Number(id))
        .input("SocioID", sql.Int, SocioID)
        .input("FechaSesion", sql.Date, FechaInicio)
        .input("HoraInicio", sql.Time, horaInicioDate)
        .input("HoraFin", sql.Time, horaFinDate)
        .input("Notas", sql.NVarChar, Descripcion || NombreClase)
        .query(`
          UPDATE SesionesPersonales SET
            SocioID = @SocioID,
            FechaSesion = @FechaSesion,
            HoraInicio = @HoraInicio,
            HoraFin = @HoraFin,
            Notas = @Notas,
            FechaModificacion = GETDATE()
          WHERE SesionID = @SesionID
        `)

      await transaction.commit()
      return NextResponse.json({ message: "Sesión personal actualizada con éxito." })
    }

    // **ACTUALIZAR CLASE GRUPAL**
    const DiaSemana = rawDiaSemana ? String(rawDiaSemana).trim() : null
    const CupoMaximo = Number(rawCupoMaximo)

    await transaction
      .request()
      .input("ClaseID", sql.Int, Number(id))
      .input("NombreClase", sql.NVarChar, NombreClase)
      .input("Descripcion", sql.NVarChar, Descripcion)
      .input("DiaSemana", sql.NVarChar, DiaSemana)
      .input("HoraInicio", sql.Time, horaInicioDate)
      .input("HoraFin", sql.Time, horaFinDate)
      .input("CupoMaximo", sql.Int, CupoMaximo)
      .input("FechaInicio", sql.Date, FechaInicio)
      .input("FechaFin", sql.Date, FechaFin)
      .input("Categoria", sql.NVarChar, Categoria)
      .query(`
        UPDATE Clases SET
          NombreClase = @NombreClase,
          Descripcion = @Descripcion,
          DiaSemana = @DiaSemana, 
          HoraInicio = @HoraInicio,
          HoraFin = @HoraFin,
          CupoMaximo = @CupoMaximo,
          FechaInicio = @FechaInicio,
          FechaFin = @FechaFin,
          Categoria = @Categoria
        WHERE ClaseID = @ClaseID
      `)

    await transaction.commit()
    return NextResponse.json({ message: "Clase grupal actualizada con éxito." })
  } catch (error) {
    if (transaction) await transaction.rollback()
    console.error("Error al actualizar:", error)
    return NextResponse.json({ error: "Error al actualizar." }, { status: 500 })
  }
}

// --- 4. ELIMINAR SESIÓN/CLASE (DELETE) ---
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const usuarioID = url.searchParams.get("usuarioID")
    const tipoClase = url.searchParams.get("tipo") // "Personal" o "Grupal"

    const entrenadorID = await getEntrenadorID(Number(usuarioID))
    if (!entrenadorID) return NextResponse.json({ error: "No autorizado." }, { status: 403 })

    const pool = await getConnection()

    // **ELIMINAR SESIÓN PERSONAL**
    if (tipoClase === "Personal") {
      const ownerCheck = await pool
        .request()
        .input("SesionID", sql.Int, Number(id))
        .input("EntrenadorID", sql.Int, entrenadorID)
        .query(`SELECT SesionID FROM SesionesPersonales WHERE SesionID = @SesionID AND EntrenadorID = @EntrenadorID`)

      if (ownerCheck.recordset.length === 0) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 })
      }

      await pool
        .request()
        .input("SesionID", sql.Int, Number(id))
        .query(`DELETE FROM SesionesPersonales WHERE SesionID = @SesionID`)

      return NextResponse.json({ message: "Sesión personal eliminada." })
    }

    // **ELIMINAR CLASE GRUPAL**
    const ownerCheck = await pool
      .request()
      .input("ClaseID", sql.Int, Number(id))
      .input("EntrenadorID", sql.Int, entrenadorID)
      .query(`SELECT ClaseID FROM Clases WHERE ClaseID = @ClaseID AND EntrenadorID = @EntrenadorID`)

    if (ownerCheck.recordset.length === 0) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 })
    }

    await pool
      .request()
      .input("ClaseID", sql.Int, Number(id))
      .query(`DELETE FROM ReservasClases WHERE ClaseID = @ClaseID`)

    await pool.request().input("ClaseID", sql.Int, Number(id)).query(`DELETE FROM Clases WHERE ClaseID = @ClaseID`)

    return NextResponse.json({ message: "Clase grupal eliminada." })
  } catch (error) {
    console.error("Error al eliminar:", error)
    return NextResponse.json({ error: "Error interno al eliminar." }, { status: 500 })
  }
}
