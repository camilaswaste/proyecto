import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pagoID = searchParams.get("pagoID");

        if (!pagoID) {
            return NextResponse.json({ error: "PagoID es requerido" }, { status: 400 });
        }

        const pool = await getConnection();

        // Consulta simplificada para obtener Pago y Socio (Eliminamos el JOIN complejo a PlanesMembresía)
        const result = await pool.request()
            .input("pagoID", pagoID)
            .query(`
                SELECT 
                    p.PagoID,
                    p.FechaPago,
                    p.MontoPago,
                    p.MedioPago,
                    p.Concepto,
                    p.SocioID,      /* Incluimos SocioID */
                    s.Nombre AS SocioNombre,
                    s.Apellido AS SocioApellido,
                    s.RUT AS SocioRUT,
                    s.Email AS SocioEmail
                FROM Pagos p
                INNER JOIN Socios s ON p.SocioID = s.SocioID
                WHERE p.PagoID = @pagoID;
            `);

        if (result.recordset.length === 0) {
            return NextResponse.json({ error: "Comprobante de pago no encontrado" }, { status: 404 });
        }

        return NextResponse.json(result.recordset[0]);

    } catch (error) {
        console.error("Error al obtener detalles de pago:", error);
        return NextResponse.json({ error: "Error interno del servidor al obtener el comprobante" }, { status: 500 });
    }
}