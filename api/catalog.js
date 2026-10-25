/**
 * `/api/catalog` — la planilla de Faq3D servida desde el CDN de Vercel.
 *
 * La landing pide el catálogo acá en vez de pegarle a Google en cada visita:
 * el CDN guarda esta respuesta 5 minutos, así que Google recibe ~12 requests
 * por hora sin importar cuánta gente entre al sitio. Antes, cada visitante
 * descargaba el CSV completo (más el redirect a `doc-04-18-sheets...`), que
 * era el punto más lento de la carga y el que podía terminar en un 429.
 *
 * Si Google falla se responde 502 **sin cachear**: el cliente conserva la
 * última copia válida (ver `useProducts`) y la web sigue mostrando el catálogo.
 * Cachear un error por cinco minutos sería peor que no cachear nada.
 */

import { GOOGLE_SHEETS_CSV_URL } from '../src/config/constants.js'

export const config = { runtime: 'edge' }

/** Cuánto vale la copia en el CDN (igual que el `max-age` de Google). */
const CACHE_SECONDS = 300
/** Cuánto se puede seguir sirviendo la copia vieja mientras se revalida. */
const STALE_SECONDS = 3600
/** Google puede tardar; pasado esto se corta y el cliente usa su copia. */
const UPSTREAM_TIMEOUT_MS = 8000

const CACHE_HEADERS = {
  'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
  'CDN-Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
}

/** Respuesta de error: nunca se cachea, para no tapar un fallo puntual. */
function failure(message, status = 502) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Método no permitido', {
      status: 405,
      headers: { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  if (!GOOGLE_SHEETS_CSV_URL || GOOGLE_SHEETS_CSV_URL.length < 5) {
    return failure('No hay URL de Google Sheets configurada.', 500)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  let upstream
  try {
    upstream = await fetch(GOOGLE_SHEETS_CSV_URL, {
      signal: controller.signal,
      // La URL publicada redirige a doc-04-18-sheets.googleusercontent.com.
      redirect: 'follow',
      headers: { Accept: 'text/csv, text/plain, */*' },
    })
  } catch {
    return failure('No se pudo consultar la planilla.')
  } finally {
    clearTimeout(timeoutId)
  }

  if (!upstream.ok) {
    return failure(`La planilla respondió ${upstream.status}.`)
  }

  let csv
  try {
    csv = await upstream.text()
  } catch {
    return failure('La planilla devolvió una respuesta ilegible.')
  }

  // Sin filas no hay catálogo: mejor un 502 (el cliente usa su copia guardada)
  // que dejar cacheado un cuerpo vacío durante cinco minutos.
  if (!csv.trim()) {
    return failure('La planilla devolvió una respuesta vacía.')
  }

  return new Response(request.method === 'HEAD' ? null : csv, {
    status: 200,
    headers: {
      ...CACHE_HEADERS,
      'Content-Type': 'text/csv; charset=utf-8',
      // Ayuda a ver en los headers si el CDN está sirviendo una copia vieja.
      'X-Catalog-Fetched-At': new Date().toISOString(),
    },
  })
}
