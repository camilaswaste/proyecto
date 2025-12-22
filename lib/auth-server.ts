import jwt from "jsonwebtoken"

export interface User {
  usuarioID: number
  nombreUsuario: string
  email: string
  nombre: string
  apellido: string
  rol: string
  rolID: number
  socioID?: number
  entrenadorID?: number
}

const JWT_SECRET = process.env.JWT_SECRET || "mundo-fitness-secret-key-2024"

export async function getUser(request?: Request): Promise<User | null> {
  try {
    if (!request) {
      return null
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as User
    return decoded
  } catch (error) {
    console.error("Error getting user from token:", error)
    return null
  }
}

export function getUserFromToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User
    return decoded
  } catch (error) {
    console.error("Error decoding token:", error)
    return null
  }
}

export function createToken(user: User): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" })
}
