// Utilidades de validación para RUT y teléfono chileno

/**
 * Valida el formato y dígito verificador del RUT chileno
 * @param rut - RUT en formato xx.xxx.xxx-x
 * @returns true si el RUT es válido
 */
export function validateRUT(rut: string): boolean {
  // Eliminar puntos y guión
  const cleanRUT = rut.replace(/\./g, "").replace(/-/g, "")

  // Verificar que tenga entre 8 y 9 caracteres
  if (cleanRUT.length < 8 || cleanRUT.length > 9) {
    return false
  }

  // Separar número y dígito verificador
  const rutNumber = cleanRUT.slice(0, -1)
  const verifier = cleanRUT.slice(-1).toUpperCase()

  // Verificar que el número sea numérico
  if (!/^\d+$/.test(rutNumber)) {
    return false
  }

  // Calcular dígito verificador
  let sum = 0
  let multiplier = 2

  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += Number.parseInt(rutNumber[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const expectedVerifier = 11 - (sum % 11)
  const calculatedVerifier = expectedVerifier === 11 ? "0" : expectedVerifier === 10 ? "K" : expectedVerifier.toString()

  return verifier === calculatedVerifier
}

/**
 * Formatea el RUT a formato xx.xxx.xxx-x
 * @param rut - RUT sin formato
 * @returns RUT formateado
 */
export function formatRUT(rut: string): string {
  // Eliminar todo lo que no sea número o K
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase()

  if (clean.length === 0) return ""

  // Separar número y dígito verificador
  const number = clean.slice(0, -1)
  const verifier = clean.slice(-1)

  // Formatear con puntos
  let formatted = ""
  let count = 0

  for (let i = number.length - 1; i >= 0; i--) {
    if (count === 3) {
      formatted = "." + formatted
      count = 0
    }
    formatted = number[i] + formatted
    count++
  }

  return formatted + "-" + verifier
}

/**
 * Valida el formato del teléfono chileno
 * @param phone - Teléfono en formato (+56) 9 xxxxxxxx
 * @returns true si el teléfono es válido
 */
export function validatePhone(phone: string): boolean {
  // Eliminar espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s()+-]/g, "")

  // Verificar formato chileno: 569xxxxxxxx (11 dígitos total)
  // o 9xxxxxxxx (9 dígitos sin código país)
  if (cleanPhone.startsWith("569") && cleanPhone.length === 11) {
    return /^569\d{8}$/.test(cleanPhone)
  } else if (cleanPhone.startsWith("9") && cleanPhone.length === 9) {
    return /^9\d{8}$/.test(cleanPhone)
  }

  return false
}

/**
 * Formatea el teléfono a formato (+56) 9 xxxx xxxx
 * @param phone - Teléfono sin formato
 * @returns Teléfono formateado
 */
export function formatPhone(phone: string): string {
  // Eliminar todo lo que no sea número
  let clean = phone.replace(/\D/g, "")

  if (clean.length === 0) return ""

  // Si empieza con 56, removerlo para reformatearlo
  if (clean.startsWith("56")) {
    clean = clean.slice(2)
  }

  // Debe empezar con 9
  if (!clean.startsWith("9")) return phone

  // Limitar a 9 dígitos
  clean = clean.slice(0, 9)

  // Formatear: (+56) 9 xxxx xxxx
  if (clean.length >= 1) {
    let formatted = "(+56) " + clean[0]
    if (clean.length > 1) {
      formatted += " " + clean.slice(1, 5)
    }
    if (clean.length > 5) {
      formatted += " " + clean.slice(5)
    }
    return formatted
  }

  return clean
}