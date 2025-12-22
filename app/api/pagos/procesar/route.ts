//api/pagos/procesar/route.ts
import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";

export async function POST(request: Request) {
  let transaction; 
  try {
    const body = await request.json();
    
    // Recibimos los datos del frontend
    const { socioID, membresiaID, planID, monto, medioPago, usuarioID, concepto } = body;

    // 1. Validaciones básicas
    if (!socioID || !monto || !medioPago) {
      return NextResponse.json({ error: "Faltan datos requeridos (socio, monto, medio)" }, { status: 400 });
    }

    const pool = await getConnection();
    
    // INICIO DE LA TRANSACCIÓN
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const requestTx = new sql.Request(transaction);

    // ID de usuario a intentar registrar (si viene vacío, probamos con el 1)
    const usuarioIntento = usuarioID || 1;

    // PASO A: Obtener datos enriquecidos Y VERIFICAR EL USUARIO
    // Agregamos una subconsulta para validar si el UsuarioRegistro existe realmente
    let queryDatos = `
        SELECT 
            s.Nombre, s.Apellido, s.Email, s.Telefono,
            (SELECT TOP 1 UsuarioID FROM Usuarios WHERE UsuarioID = @uid) as UsuarioValido
    `;

    // Lógica inteligente: ¿Qué estamos pagando?
    if (planID) {
        // Caso 1: Compra directa de un Plan (Venta Nueva)
        queryDatos += `, p.NombrePlan, p.DuracionDias, GETDATE() as FechaInicio, DATEADD(day, p.DuracionDias, GETDATE()) as FechaVencimiento 
                       FROM Socios s 
                       CROSS JOIN PlanesMembresía p 
                       WHERE s.SocioID = @sid AND p.PlanID = @pid`;
    } 
    else if (membresiaID) {
        // Caso 2: Pago de una Membresía ya registrada
        queryDatos += `, p.NombrePlan, p.DuracionDias, m.FechaInicio, m.FechaVencimiento
                       FROM Socios s
                       LEFT JOIN Membresías m ON m.MembresíaID = @mid
                       LEFT JOIN PlanesMembresía p ON m.PlanID = p.PlanID
                       WHERE s.SocioID = @sid`;
    } 
    else {
        // Caso 3: Pago Genérico
        queryDatos += `, 'Pago General' as NombrePlan, 0 as DuracionDias, NULL as FechaInicio, NULL as FechaVencimiento 
                       FROM Socios s WHERE s.SocioID = @sid`;
    }

    const datosSocio = await requestTx
      .input("sid", socioID)
      .input("mid", membresiaID || null)
      .input("pid", planID || null)
      .input("uid", usuarioIntento) // Pasamos el ID para verificarlo
      .query(queryDatos);

    if (datosSocio.recordset.length === 0) {
      throw new Error("Socio no encontrado");
    }
    
    const info = datosSocio.recordset[0];
    const nombreCompleto = `${info.Nombre} ${info.Apellido}`;
    const conceptoFinal = concepto || `Pago de ${info.NombrePlan || 'Servicio'}`;
    
    // CORRECCIÓN CLAVE: Si el usuario no existe en la BD, usamos NULL para evitar el error de FK
    const usuarioRegistroFinal = info.UsuarioValido || null;

    // PASO B: Insertar el PAGO
    const resultPago = await requestTx
      .input("socioID_ins", socioID)
      .input("membresiaID_ins", membresiaID || null)
      .input("monto_ins", monto)
      .input("medio_ins", medioPago)
      .input("usuario_ins", usuarioRegistroFinal) // Usamos el ID verificado (o null)
      .input("concepto_ins", conceptoFinal)
      .query(`
        INSERT INTO Pagos (SocioID, MembresíaID, MontoPago, MedioPago, FechaPago, UsuarioRegistro, Concepto)
        OUTPUT INSERTED.PagoID
        VALUES (@socioID_ins, @membresiaID_ins, @monto_ins, @medio_ins, GETDATE(), @usuario_ins, @concepto_ins)
      `);

    const nuevoPagoID = resultPago.recordset[0].PagoID;

    // PASO C: Generar Número de Comprobante Único
    const numComprobante = `COMP-${Date.now()}-${nuevoPagoID}`;

    // PASO D: Insertar el COMPROBANTE
    await requestTx
      .input("pagoID_ins", nuevoPagoID)
      .input("numComp", numComprobante)
      .input("nombreSocio", nombreCompleto)
      .input("email", info.Email || "")
      .input("tel", info.Telefono || "")
      .input("plan", info.NombrePlan || "Venta General")
      .input("duracion", info.DuracionDias || 0)
      .input("fInicio", info.FechaInicio || null)
      .input("fFin", info.FechaVencimiento || null)
      .query(`
        INSERT INTO Comprobantes (
            PagoID, SocioID, MembresíaID, NumeroComprobante, 
            FechaEmision, MontoPago, MedioPago, 
            NombreSocio, EmailSocio, TelefonoSocio, 
            NombrePlan, DuracionPlan, FechaInicio, FechaVencimiento,
            Concepto, UsuarioRegistro, Estado
        )
        VALUES (
            @pagoID_ins, @socioID_ins, @membresiaID_ins, @numComp,
            GETDATE(), @monto_ins, @medio_ins,
            @nombreSocio, @email, @tel,
            @plan, @duracion, @fInicio, @fFin,
            @concepto_ins, @usuario_ins, 'Emitido'
        )
      `);

    // FINALIZAR TRANSACCIÓN
    await transaction.commit();

    console.log(`Pago procesado correctamente: ID ${nuevoPagoID} (Usuario: ${usuarioRegistroFinal ? usuarioRegistroFinal : 'Sistema/Anónimo'})`);

    return NextResponse.json({
      success: true,
      pagoID: nuevoPagoID,
      mensaje: "Pago procesado exitosamente"
    });

  } catch (error: any) {
    if (transaction) {
      console.warn("Rollback ejecutado por error en proceso de pago");
      await transaction.rollback();
    }
    
    console.error("Error backend al procesar pago:", error);
    // Devolvemos el mensaje limpio si es error de SQL conocido
    const msg = error.originalError?.info?.message || error.message;
    return NextResponse.json({ 
      error: "Error al procesar el pago",
      detalle: msg 
    }, { status: 500 });
  }
}