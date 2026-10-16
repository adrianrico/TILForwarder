/**
 * Helpers puros para manejar los eventos/subeventos de una ruta.
 * Una ruta tiene eventos (`event_name`) con subeventos (`sub_events`); el evento
 * especial "cancelado" siempre existe en la UI pero NO se envía al backend.
 */

/** @returns {boolean} true si el nombre corresponde al evento reservado "cancelado". */
export function isCancelado(name) {
  return (name ?? '').toString().trim().toLowerCase() === 'cancelado'
}

/** Acepta arreglo o texto separado por , ; o salto de línea y devuelve un arreglo limpio. */
export function normalizeSubEvents(subEvents) {
  if (Array.isArray(subEvents)) return subEvents
  if (typeof subEvents === 'string') {
    return subEvents
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(s => s !== '')
  }
  return []
}

/** Construye la lista editable: "cancelado" fijo al inicio + eventos del backend. */
export function buildEvents(events) {
  return [
    { event_name: 'cancelado', sub_events: [] },
    ...(events ?? [])
      .filter(ev => !isCancelado(ev.event_name))
      .map(ev => ({ event_name: ev.event_name ?? '', sub_events: normalizeSubEvents(ev.sub_events) })),
  ]
}

/**
 * Prepara los eventos para enviarlos al backend: quita "cancelado", aplica `sanitize`
 * (p. ej. trim/mayúsculas) y descarta subeventos vacíos.
 */
export function processRouteEvents(events = [], sanitize = v => v) {
  return events
    .filter(ev => !isCancelado(ev.event_name))
    .map(ev => ({
      event_name: sanitize(ev.event_name ?? ''),
      sub_events: (ev.sub_events ?? []).map(se => sanitize(se ?? '')).filter(se => se !== ''),
    }))
}
