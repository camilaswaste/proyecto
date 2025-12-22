// /api/entrenador/clases/route.ts
import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"

const parseTimeToDate = (timeString: string) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}
// Función para obtener el EntrenadorID del usuario logueado
const getEntrenadorID = async (usuarioID: number) => {
    const pool = await getConnection()
    const result = await pool.request()
        .input("UsuarioID", sql.Int, usuarioID)
        .query(`
            SELECT EntrenadorID 
            FROM Entrenadores 
            WHERE UsuarioID = @UsuarioID AND Activo = 1
        `)
    return result.recordset[0]?.EntrenadorID
}

// --- 1. OBTENER CLASES ASIGNADAS (GET) ---
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
        const clasesResult = await pool
            .request()
            .input("EntrenadorID", sql.Int, entrenadorID)
            .query(`
            SELECT 
              c.ClaseID, c.NombreClase, c.Descripcion, c.DiaSemana, c.HoraInicio, c.HoraFin, 
              c.CupoMaximo, c.Activa AS Estado, c.FechaInicio, c.FechaFin, c.Categoria,
              e.EntrenadorID, 
              u.Nombre + ' ' + u.Apellido AS NombreEntrenador, 
              (
                  SELECT COUNT(ReservaID) 
                  FROM ReservasClases 
                  WHERE ClaseID = c.ClaseID AND Estado IN ('Reservada', 'Asistió')
              ) AS CuposOcupados
            FROM Clases c
            INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
            INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
            WHERE c.EntrenadorID = @EntrenadorID 
            ORDER BY c.DiaSemana, c.HoraInicio
          `)

        const clasesFormateadas = clasesResult.recordset.map(clase => {
            const cleanedDiaSemana = String(clase.DiaSemana || '').trim();
            return {
                ...clase,
                DiaSemana: cleanedDiaSemana,
                DiasSemana: cleanedDiaSemana ? [cleanedDiaSemana] : [],
                TipoClase: clase.CupoMaximo === 1 ? 'Personal' : 'Grupal'
            }
        })

        return NextResponse.json(clasesFormateadas)
    } catch (error) {
        console.error("Error al obtener clases:", error)
        return NextResponse.json({ error: "Error interno al obtener clases." }, { status: 500 })
    }
}

// --- 2. CREAR CLASE (POST) ---
// --- 2. CREAR CLASE (POST) ---
export async function POST(request: Request) {
    const pool = await getConnection();
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
            NombreClase, Descripcion, DiaSemana: rawDiaSemana, HoraInicio: rawHoraInicio, HoraFin: rawHoraFin,
            CupoMaximo: rawCupoMaximo, FechaInicio, FechaFin, Categoria,
            TipoClase, SocioID: rawSocioID
        } = body

        // Definición de variables convertidas
        const horaInicioDate = parseTimeToDate(rawHoraInicio);
        const horaFinDate = parseTimeToDate(rawHoraFin);
        const DiaSemana = rawDiaSemana ? String(rawDiaSemana).trim() : null;

        const esPersonal = TipoClase === 'Personal'
        const SocioID = esPersonal ? Number(rawSocioID) : null
        const CupoMaximo = esPersonal ? 1 : Number(rawCupoMaximo)

        if (!NombreClase || !DiaSemana || !horaInicioDate || !CupoMaximo || !Categoria) {
            await transaction.rollback()
            return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 })
        }

        // --- CORRECCIÓN AQUÍ: Usar horaInicioDate y horaFinDate ---
        const overlapCheck = await transaction.request()
            .input("EntrenadorID", sql.Int, entrenadorID)
            .input("DiaSemana", sql.NVarChar, DiaSemana)
            .input("HoraInicio", sql.Time, horaInicioDate) // Antes decía HoraInicio (erróneo)
            .input("HoraFin", sql.Time, horaFinDate)       // Antes decía HoraFin (erróneo)
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

        const claseInsertResult = await transaction.request()
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

        if (esPersonal && SocioID && nuevaClaseID) {
            await transaction.request()
                .input("ClaseID", sql.Int, nuevaClaseID)
                .input("SocioID", sql.Int, SocioID)
                .input("FechaClase", sql.Date, FechaInicio)
                .query(`
                    INSERT INTO ReservasClases (ClaseID, SocioID, FechaClase, Estado)
                    VALUES (@ClaseID, @SocioID, @FechaClase, 'Reservada')
                `)
        }

        await transaction.commit()
        return NextResponse.json({ message: "Clase creada con éxito.", ClaseID: nuevaClaseID }, { status: 201 })
    } catch (error) {
        if (transaction) await transaction.rollback()
        console.error("Error al crear clase:", error)
        return NextResponse.json({ error: "Error al crear clase en la base de datos." }, { status: 500 })
    }
}
// --- 3. ACTUALIZAR CLASE (PUT) ---
export async function PUT(request: Request) {
    const transaction = new sql.Transaction(await getConnection())
    await transaction.begin()
    try {
        const url = new URL(request.url)
        const claseID = url.searchParams.get("id")
        const usuarioID = url.searchParams.get("usuarioID")
        const body = await request.json()

        const entrenadorID = await getEntrenadorID(Number(usuarioID))
        if (!entrenadorID) {
            await transaction.rollback()
            return NextResponse.json({ error: "No autorizado." }, { status: 403 })
        }
        
        const { 
            NombreClase, Descripcion, DiaSemana: rawDiaSemana, HoraInicio: rawHoraInicio, HoraFin: rawHoraFin,
            CupoMaximo: rawCupoMaximo, FechaInicio, FechaFin, Categoria, 
            TipoClase, SocioID: rawSocioID 
        } = body

        // **SOLUCIÓN AL ERROR DE VALIDACIÓN**
        const horaInicioDate = parseTimeToDate(rawHoraInicio);
        const horaFinDate = parseTimeToDate(rawHoraFin);
        const DiaSemana = rawDiaSemana ? String(rawDiaSemana).trim() : null;

        const esPersonal = TipoClase === 'Personal'
        const SocioID = esPersonal ? Number(rawSocioID) : null
        const CupoMaximo = esPersonal ? 1 : Number(rawCupoMaximo)

        await transaction.request()
            .input("ClaseID", sql.Int, Number(claseID))
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

        if (esPersonal && SocioID) {
             await transaction.request()
                .input("ClaseID", sql.Int, Number(claseID))
                .query(`DELETE FROM ReservasClases WHERE ClaseID = @ClaseID`)
                
             await transaction.request()
                .input("ClaseID", sql.Int, Number(claseID))
                .input("SocioID", sql.Int, SocioID)
                .input("FechaClase", sql.Date, FechaInicio)
                .query(`
                    INSERT INTO ReservasClases (ClaseID, SocioID, FechaClase, Estado)
                    VALUES (@ClaseID, @SocioID, @FechaClase, 'Reservada')
                `)
        }

        await transaction.commit()
        return NextResponse.json({ message: "Clase actualizada con éxito." })
    } catch (error) {
        if (transaction) await transaction.rollback()
        console.error("Error al actualizar clase:", error)
        return NextResponse.json({ error: "Error al actualizar clase." }, { status: 500 })
    }
}

// --- 4. ELIMINAR CLASE (DELETE) ---
export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url)
        const claseID = url.searchParams.get("id")
        const usuarioID = url.searchParams.get("usuarioID")

        const entrenadorID = await getEntrenadorID(Number(usuarioID))
        if (!entrenadorID) return NextResponse.json({ error: "No autorizado." }, { status: 403 })

        const pool = await getConnection()
        const ownerCheck = await pool.request()
            .input("ClaseID", sql.Int, Number(claseID))
            .input("EntrenadorID", sql.Int, entrenadorID)
            .query(`SELECT ClaseID FROM Clases WHERE ClaseID = @ClaseID AND EntrenadorID = @EntrenadorID`)

        if (ownerCheck.recordset.length === 0) return NextResponse.json({ error: "No autorizado." }, { status: 403 })

        await pool.request().input("ClaseID", sql.Int, Number(claseID)).query(`DELETE FROM ReservasClases WHERE ClaseID = @ClaseID`)
        await pool.request().input("ClaseID", sql.Int, Number(claseID)).query(`DELETE FROM Clases WHERE ClaseID = @ClaseID`)

        return NextResponse.json({ message: "Clase eliminada." })
    } catch (error) {
        console.error("Error al eliminar:", error)
        return NextResponse.json({ error: "Error interno al eliminar." }, { status: 500 })
    }
}