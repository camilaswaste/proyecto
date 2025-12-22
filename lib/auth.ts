import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "f2b194816aecf83207e99f52a79d5aafb6365c992482ae150af3672620be3d53"

/**
 * Hashea una contraseña usando bcrypt
 * @param password - La contraseña en texto plano
 * @returns La contraseña hasheada
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verifica si una contraseña coincide con su hash
 * @param password - La contraseña en texto plano
 * @param hash - El hash almacenado
 * @returns true si la contraseña es correcta
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Genera una contraseña temporal aleatoria
 * @param length - Longitud de la contraseña (por defecto 8)
 * @returns Contraseña temporal generada
 */
export function generateTemporaryPassword(length = 8): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export interface UserPayload {
  usuarioID: number
  nombreUsuario: string
  email: string
  rol: string
  rolID: number
  socioID?: number
  entrenadorID?: number
}

export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch (error) {
    console.error("Error verificando token:", error)
    return null
  }
}

export function generateQRCode(socioID: number): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `MF-${socioID}-${timestamp}-${random}`
}
