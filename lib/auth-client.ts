// Client-side authentication utilities

export interface User {
  usuarioID: number
  nombreUsuario: string
  email: string
  nombre: string
  apellido: string
  rol: string
  rolID: number
  socioID?: number // Opcional: usado cuando el usuario es un socio
  entrenadorID?: number // Opcional: usado cuando el usuario es un entrenador
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/login"
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
