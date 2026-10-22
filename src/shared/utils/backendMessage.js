/**
 * Extrae un mensaje legible de un error de Axios.
 * Prioridad: mensaje del backend → mensaje normalizado del cliente → `fallback`.
 * Nunca devuelve trazas ni objetos internos.
 *
 * @param {unknown} err       Error capturado en `onError` de una mutación/consulta.
 * @param {string}  [fallback] Texto a usar si no hay mensaje disponible.
 * @returns {string|undefined}
 */
export function backendMessage(err, fallback) {
  const message = err?.response?.data?.message ?? err?.response?.data?.error?.message ?? err?.userMessage
  return typeof message === 'string' ? message : fallback
}
