/**
 * Utilidades geográficas.
 */

/**
 * Convierte un texto "lat,lng" en coordenadas validadas.
 * Rechaza cualquier otra cosa (URLs, texto libre) y valores fuera de rango,
 * de modo que un dato malicioso o corrupto nunca llegue al mapa.
 *
 * @param {string} str Ej. "19.43, -99.13"
 * @returns {[number, number] | null}
 */
export function parseCoords(str) {
  if (typeof str !== 'string') return null
  const match = str.trim().match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/)
  if (!match) return null
  const lat = parseFloat(match[1])
  const lng = parseFloat(match[2])
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return [lat, lng]
}

/**
 * Devuelve la URL solo si es http(s); si no, `null`.
 * Úsese antes de poner cualquier URL proveniente del backend en un `href`
 * (bloquea esquemas como `javascript:` y `data:`).
 *
 * @param {string} value
 * @returns {string | null}
 */
export function safeHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}
