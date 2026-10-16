/**
 * Reglas de validación reutilizables para `Form.Item` de Ant Design.
 * Validar en el cliente mejora la experiencia, pero NO sustituye la validación
 * del backend (el cliente siempre puede ser manipulado).
 */

/** Longitud máxima razonable para campos de texto libre. */
export const MAX_TEXT = 200

/** Reglas de un campo de texto obligatorio con límite de longitud. */
export const requiredText = (label) => [
  { required: true, whitespace: true, message: `${label} es obligatorio` },
  { max: MAX_TEXT, message: `Máximo ${MAX_TEXT} caracteres` },
]

/** Email opcional: si se escribe, debe tener formato válido. */
export const optionalEmail = [
  { type: 'email', message: 'Correo electrónico inválido' },
  { max: MAX_TEXT, message: `Máximo ${MAX_TEXT} caracteres` },
]

/** Teléfono opcional: dígitos, espacios y símbolos habituales (+ - ( )). */
export const optionalPhone = [
  { pattern: /^[0-9+()\-\s]{7,20}$/, message: 'Teléfono inválido', warningOnly: false },
]

/**
 * RFC mexicano (persona moral de 12 o física de 13 caracteres), opcional.
 * Valida solo el FORMATO; el backend decide si el RFC existe.
 */
export const optionalRfc = [
  {
    pattern: /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i,
    message: 'RFC inválido (12 o 13 caracteres)',
  },
]
