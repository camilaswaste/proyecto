import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

// PUT - Actualizar estado de una reserva
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; reservaId: string }> }) {
  try {
    const { reservaId } = await params
    const body = await request.json()
    const { estado } = body

    console.log("[v0] Actualizando reserva:", { reservaId, estado })

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("reservaId", reservaId)
      .input("estado", estado)
      .query(`
        UPDATE ReservasClases
        SET Estado = @estado
        OUTPUT INSERTED.*
        WHERE ReservaID = @reservaId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    console.log("[v0] Reserva actualizada exitosamente")
    return NextResponse.json(result.recordset[0])
  } catch (error: any) {
    console.error("[v0] Error al actualizar reserva:", error)
    return NextResponse.json({ error: "Error al actualizar reserva", details: error.message }, { status: 500 })
  }
}

// DELETE - Cancelar una reserva
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; reservaId: string }> }) {
  try {
    const { reservaId } = await params
    console.log("[v0] Cancelando reserva:", reservaId)

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("reservaId", reservaId)
      .query(`
        UPDATE ReservasClases
        SET Estado = 'Cancelada'
        OUTPUT INSERTED.*
        WHERE ReservaID = @reservaId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    console.log("[v0] Reserva cancelada exitosamente")
    return NextResponse.json(result.recordset[0])
  } catch (error: any) {
    console.error("[v0] Error al cancelar reserva:", error)
    return NextResponse.json({ error: "Error al cancelar reserva", details: error.message }, { status: 500 })
  }
}
