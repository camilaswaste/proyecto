import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import sql from "mssql"
import { crearNotificacion } from "@/lib/notifications" // Asegúrate de que la ruta sea correcta

export async function GET(
  request: Request,
  { params }: { params: Promise<{ claseID: string }> }
) {
  try {
    const { claseID } = await params
    const url = new URL(request.url)
    const usuarioID = url.searchParams.get("usuarioID")

    if (!claseID || !usuarioID) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    const pool = await getConnection()
    const result = await pool.request()
      .input("ClaseID", sql.Int, claseID)
      .input("UsuarioID", sql.Int, usuarioID)
      .query(`
        SELECT 
            rc.*, 
            s.Nombre, s.Apellido, s.Email, s.FotoURL, s.EstadoSocio
        FROM ReservasClases rc
        INNER JOIN Socios s ON rc.SocioID = s.SocioID
        INNER JOIN Clases c ON rc.ClaseID = c.ClaseID
        INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
        WHERE rc.ClaseID = @ClaseID AND e.UsuarioID = @UsuarioID
      `)

    // IMPORTANTE: Siempre debe haber un retorno
    return NextResponse.json(result.recordset)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ claseID: string }> }
) {
  try {
    const { claseID } = await params;
    const { socioId, fechaClase } = await request.json();
    const url = new URL(request.url);
    const usuarioID = url.searchParams.get("usuarioID");

    if (!usuarioID) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const pool = await getConnection();

    // VALIDACIÓN: Usando 'Membresías', 'FechaVencimiento' y estado 'Vigente'
    const checkPlan = await pool.request()
      .input("SocioID", sql.Int, socioId)
      .query(`
        SELECT TOP 1 m.Estado, s.Nombre, s.Apellido 
        FROM Membresías m
        INNER JOIN Socios s ON m.SocioID = s.SocioID
        WHERE m.SocioID = @SocioID 
        AND m.Estado = 'Vigente' 
        AND m.FechaVencimiento >= GETDATE()
      `);

    if (checkPlan.recordset.length === 0) {
      return NextResponse.json({ 
        error: "El socio no tiene una membresía 'Vigente' o ya venció." 
      }, { status: 403 });
    }

    const socioNombre = `${checkPlan.recordset[0].Nombre} ${checkPlan.recordset[0].Apellido}`;

    // ... lógica de inserción en ReservasClases ...

    // Notificación corregida
    await crearNotificacion({
      tipoUsuario: "Entrenador",
      usuarioID: Number.parseInt(usuarioID),
      tipoEvento: "inscripcion_clase",
      titulo: "Nueva Inscripción",
      mensaje: `Inscribiste a ${socioNombre} para la clase del ${fechaClase}.`
    });

    return NextResponse.json({ message: "Inscripción exitosa" });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Error en el servidor al validar membresía" }, { status: 500 });
  }
}