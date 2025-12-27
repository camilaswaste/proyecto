import { getConnection } from "@/lib/db"
import crypto from "crypto"
import sql from "mssql"
import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    console.log("[v0] Forgot password request for:", email)

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const userResult = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT 
          UsuarioID AS ID,
          Nombre,
          Email,
          'Usuario' AS TipoUsuario
        FROM Usuarios
        WHERE Email = @email
        
        UNION
        
        SELECT 
          SocioID AS ID,
          Nombre + ' ' + Apellido AS Nombre,
          Email,
          'Socio' AS TipoUsuario
        FROM Socios
        WHERE Email = @email
      `)

    console.log("[v0] Query executed")
    console.log("[v0] Records found:", userResult.recordset.length)
    console.log("[v0] User data:", userResult.recordset[0] || "No user found")

    if (userResult.recordset.length === 0) {
      console.log("[v0] User found: false")
      // Por seguridad, devolvemos éxito aunque el usuario no exista
      return NextResponse.json({
        message: "Si el email existe, recibirás instrucciones para recuperar tu contraseña",
      })
    }

    const usuario = userResult.recordset[0]
    console.log("[v0] User found: true, Type:", usuario.TipoUsuario, "ID:", usuario.ID)

    // Generar token único
    const token = crypto.randomBytes(32).toString("hex")
    const expiracion = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    console.log("[v0] Generated token:", token.substring(0, 10) + "...")

    if (usuario.TipoUsuario === "Usuario") {
      await pool
        .request()
        .input("usuarioID", sql.Int, usuario.ID)
        .input("token", sql.VarChar, token)
        .input("expiracion", sql.DateTime, expiracion)
        .input("tipoUsuario", sql.VarChar, "Usuario")
        .query(`
          INSERT INTO TokensRecuperacion (TipoUsuario, UsuarioID, SocioID, Token, FechaExpiracion)
          VALUES (@tipoUsuario, @usuarioID, NULL, @token, @expiracion)
        `)
    } else {
      await pool
        .request()
        .input("socioID", sql.Int, usuario.ID)
        .input("token", sql.VarChar, token)
        .input("expiracion", sql.DateTime, expiracion)
        .input("tipoUsuario", sql.VarChar, "Socio")
        .query(`
          INSERT INTO TokensRecuperacion (TipoUsuario, UsuarioID, SocioID, Token, FechaExpiracion)
          VALUES (@tipoUsuario, NULL, @socioID, @token, @expiracion)
        `)
    }

    console.log("[v0] Token saved to database")

    // Construir URL de reset
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mundo-fitness-chimbarongo.vercel.app"
    const resetUrl = `${baseUrl}/reset-password/${token}`

    console.log("[v0] Reset URL:", resetUrl)
    console.log("[v0] RESEND_API_KEY configured:", !!process.env.RESEND_API_KEY)

    try {
      const result = await resend.emails.send({
        from: "Mundo Fitness <onboarding@resend.dev>",
        to: email,
        subject: "Recuperación de Contraseña - Mundo Fitness",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Recuperación de Contraseña</h1>
                </div>
                <div class="content">
                  <p>Hola ${usuario.Nombre},</p>
                  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Mundo Fitness Chimbarongo.</p>
                  <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                  <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                  </div>
                  <p>O copia y pega este enlace en tu navegador:</p>
                  <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
                  <p><strong>Este enlace expirará en 1 hora.</strong></p>
                  <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Mundo Fitness Chimbarongo. Todos los derechos reservados.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      })

      console.log("[v0] Email sent successfully:", result)
    } catch (emailError) {
      console.error("[v0] Error sending email:", emailError)
      throw emailError
    }

    return NextResponse.json({
      message: "Si el email existe, recibirás instrucciones para recuperar tu contraseña",
    })
  } catch (error) {
    console.error("[v0] Error en forgot-password:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
