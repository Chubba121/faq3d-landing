import { useState, useEffect, useCallback, useRef } from 'react'
import { GOOGLE_SHEETS_CSV_URL } from '../config/constants.js'
import { hexFromColorName, normalizeColorValue, parseFilamentColors } from '../config/colors.js'
import { normalizeCategoryId } from '../config/categories.js'
import {
  driveImageUrl,
  drivePreviewUrl,
  hasMediaExtension,
  isVideoSource,
} from '../config/media.js'
import { PRODUCTS as LOCAL_PRODUCTS } from '../data/products.js'

/**
 * useProducts
 *
 * Carga el catálogo desde el CSV público de Google Sheets y lo mantiene al día:
 * cada POLL_INTERVAL_MS (60 minutos) vuelve a consultar la planilla en segundo
 * plano y solo actualiza el estado si algo cambió (precio, stock, productos
 * nuevos), así que el visitante ve los cambios sin recargar la pestaña.
 * Además, al volver a la pestaña (de estar oculta) se actualiza al instante.
 *
 * Para que el catálogo aparezca DE INMEDIATO al abrir o recargar la web:
 *   1. La última versión válida se guarda en localStorage. Al arrancar se lee
 *      de forma sincrónica y se pinta en el primer frame (stale-while-revalidate:
 *      se ve al instante y se refresca en segundo plano).
 *   2. La petición al CSV arranca desde el index.html (script inline), en
 *      paralelo con la descarga del bundle: la app reutiliza esa misma
 *      respuesta y no vuelve a pedirla.
 *   3. Mientras no hay ningún dato (primera visita) se muestran esqueletos, nunca
 *      el catálogo local de ejemplo: los precios y la disponibilidad falsos
 *      Confundían al cliente.
 *
 * Si la URL está vacía, la petición falla o la hoja no trae filas utilizables,
 * cae automáticamente al archivo local de productos (src/data/products.js) para
 * que la web nunca quede en blanco. Una falla puntual en una actualización
 * posterior no borra el catálogo: se conserva la última versión válida.
 *
 * Hook estatal mínimo y orientado a retail:
 *   - isLoading: true mientras no hay todavía nada que mostrar.
 *   - error: string breve si la petición falló (o si una actualización falló).
 *   - products: array de productos siempre definido.
 *   - fromSheet: true si los datos vinieron del CSV, false si vinieron del local.
 *   - hiddenCount: productos de la planilla que quedaron ocultos (active distinto de TRUE).
 *   - lastUpdated: timestamp de la última consulta correcta.
 *   - isRefreshing: true mientras hay una consulta en curso.
 */

const PLACEHOLDER_IMAGE = '/products/placeholder.svg'
const REQUEST_TIMEOUT_MS = 8000

// Cada cuánto se vuelve a consultar la planilla: 60 minutos.
// Se puede ajustar con VITE_SHEETS_POLL_MS (por ejemplo, para probar más rápido).
const POLL_INTERVAL_MS = Number(import.meta.env?.VITE_SHEETS_POLL_MS) || 60 * 60 * 1000

// Clave de la copia local del catálogo. Cambiar la versión invalida la copia
// guardada (por ejemplo, si cambia la forma de los datos).
const CACHE_KEY = 'faq3d:catalog:v2'

// Cache de módulo: evita pedir el CSV dos veces (StrictMode en desarrollo o
// dos consumidores del hook) y comparte la misma respuesta.
let sheetRequest = null

// Texto del CSV que|下载 el script inline del index.html (arranca antes de que
// se descargue el bundle). Se consume una sola vez, por la primera carga real
// del hook, para que las consultas posteriores del polling siempre pegan a la red.
let preloaded = null

function fetchSheetProducts() {
  // Petición en vuelo: se comparte.
  if (sheetRequest) return sheetRequest

  sheetRequest = loadSheetProducts().finally(() => {
    sheetRequest = null
  })
  return sheetRequest
}

export default function useProducts() {
  // Copia local del catálogo: se lee una sola vez y de forma sincrónica para
  // que el primer frame ya muestre los datos reales de la planilla.
  const cacheRef = useRef(null)
  const cacheReadRef = useRef(false)
  if (!cacheReadRef.current) {
    cacheReadRef.current = true
    cacheRef.current = readCachedCatalog()
  }
  const cached = cacheRef.current

  const [isLoading, setIsLoading] = useState(() => !cached)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState(() => cached?.products ?? [])
  const [fromSheet, setFromSheet] = useState(() => Boolean(cached))
  const [hiddenCount, setHiddenCount] = useState(() => cached?.hiddenCount ?? 0)
  const [lastUpdated, setLastUpdated] = useState(() => cached?.lastUpdated ?? null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Firma del catálogo cargado: sirve para saber si algo cambió de verdad.
  const signatureRef = useRef(cached?.signature ?? null)
  // ¿Ya tenemos alguna versión válida del catálogo?
  const loadedRef = useRef(Boolean(cached))

  const loadFromSheet = useCallback(async () => fetchSheetProducts(), [])

  useEffect(() => {
    let active = true
    let timer = null
    let inFlight = false

    // Copia vieja (por ejemplo, guardada por una versión anterior que no
    // normalizaba la categoría): se repara en disco una sola vez, al
    // arrancar. No se cambia la fecha de actualización porque sigue siendo
    // la de la última consulta correcta a la planilla.
    if (cached?.stale) {
      writeCachedCatalog(cached.products, cached.hiddenCount, cached.signature, cached.lastUpdated)
    }

    const applyResult = (result) => {
      if (!active) return

      // El texto descargado deja de estar disponible: las consultas del
      // polling siguiente tienen que pegarle a la red para detectar cambios.
      if (preloaded) preloaded.applied = true

      if (result.ok) {
        // Solo se repinta si el catálogo cambió de verdad.
        const signature = signatureOf(result.data)
        if (signature !== signatureRef.current) {
          signatureRef.current = signature
          setProducts(result.data)
        }
        setHiddenCount(result.hidden ?? 0)
        writeCachedCatalog(result.data, result.hidden ?? 0, signature)
        setError(null)
        setFromSheet(true)
        setLastUpdated(Date.now())
        loadedRef.current = true
        setIsLoading(false)
        return
      }

      if (!loadedRef.current) {
        // Primera carga fallida: catálogo local de respaldo.
        setError(
          `${result.reason || 'No se pudieron cargar los productos desde Google Sheets.'} Se muestra el catálogo local de respaldo.`,
        )
        setProducts(normalizeLocalProducts(LOCAL_PRODUCTS))
        setHiddenCount(0)
        setFromSheet(false)
      } else {
        // Falla puntual en una actualización: conservamos la última versión válida.
        setError(`No se pudo actualizar el catálogo: ${result.reason}. Se mantiene la última versión cargada.`)
      }
      setIsLoading(false)
    }

    const poll = async () => {
      if (!active || inFlight) return
      // Con la pestaña oculta no gastamos consultas; al volver se actualiza al toque.
      if (typeof document !== 'undefined' && document.hidden) return

      inFlight = true
      setIsRefreshing(true)
      try {
        applyResult(await loadFromSheet())
      } finally {
        inFlight = false
        if (active) setIsRefreshing(false)
      }
    }

    poll()
    timer = setInterval(poll, POLL_INTERVAL_MS)

    const onVisibilityChange = () => {
      if (!document.hidden) poll()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      active = false
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [loadFromSheet, cached])

  return { isLoading, error, products, fromSheet, hiddenCount, lastUpdated, isRefreshing }
}

/** Lee la copia local del catálogo. Devuelve null si no hay o si está corrupta. */
function readCachedCatalog() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.products) || !parsed.products.length) return null
    if (!parsed.lastUpdated) return null

    // Se sanean los productos: una copia vieja o manipulada no puede dejar
    // campos sin definir (colores, precio) y romper el render.
    // La categoría se NORMALIZA también: una copia guardada por una versión
    // anterior guardaba la categoría tal como venía de la planilla
    // ("Muñecos & Figuras") y el producto no entraba en su estante, que
    // aparecía vacío hasta que llegaba la planilla.
    const products = parsed.products
      .filter((product) => product && String(product.name ?? '').trim())
      .map((product) => ({
        ...product,
        id: String(product.id ?? '').trim(),
        name: String(product.name ?? '').trim(),
        category: normalizeCategoryId(product.category),
        price: Number(product.price) || 0,
        status: String(product.status ?? '').toLowerCase() === 'stock' ? 'stock' : 'pedido',
        // También se re-normaliza la foto: una copia guardada antes (con un
        // link de Drive crudo) se arregla al arrancar, sin esperar la planilla.
        image: normalizeSheetImage(product.image),
        video: normalizeSheetVideo(product.video),
        description: String(product.description ?? '').trim(),
        colors: Array.isArray(product.colors)
          ? product.colors.map((color) => {
              const name = String(color?.name ?? '').trim()
              return {
                name,
                // El valor puede ser un degradado o un rgba (no un hex): si se
                // filtrara con un /^#/ el efecto especial se perdería.
                hex: normalizeColorValue(color?.hex) || hexFromColorName(name),
              }
            })
          : [],
        featured: Boolean(product.featured),
      }))

    if (!products.length) return null

    const signature = signatureOf(products)

    return {
      products,
      hiddenCount: Number(parsed.hiddenCount) || 0,
      lastUpdated: Number(parsed.lastUpdated) || null,
      // La firma se recalcula sobre los productos ya normalizados: si no, una
      // copia vieja se compararía contra la planilla y el catálogo se
      // repintaría aunque no haya cambiado nada.
      signature,
      // La copia quedó vieja (por ejemplo, guardada por una versión anterior
      // que no normalizaba la categoría): se repara en disco al arrancar.
      stale: parsed.signature !== signature,
    }
  } catch {
    return null
  }
}

/** Guarda la copia local del catálogo para el próximo arranque. */
function writeCachedCatalog(products, hiddenCount, signature, lastUpdated = Date.now()) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        lastUpdated,
        hiddenCount,
        signature,
        products,
      }),
    )
  } catch {
    // Sin localStorage (modo privado, cuota llena): la web sigue funcionando.
  }
}

/**
 * Texto del CSV: se reaprovecha el pedido que arrancó el script inline del
 * index.html (llega antes que el bundle) y, si ya se usó, se pide de nuevo.
 */
function loadSheetText() {
  if (!preloaded && typeof window !== 'undefined' && window.__faq3dCatalog) {
    preloaded = { promise: window.__faq3dCatalog, applied: false }
  }

  if (preloaded && !preloaded.applied) {
    // Si el precargado falló (un error de red puntual) se reintenta con una
    // petición propia: el precargado es una ayuda, no un punto único de fallo.
    return preloaded.promise
      .then((text) => (text ? { text } : requestSheetText()))
      .catch(() => requestSheetText())
  }

  return requestSheetText()
}

/** Pide el CSV público y devuelve { text } o { text: null, reason }. */
async function requestSheetText() {
  let response
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    response = await fetch(GOOGLE_SHEETS_CSV_URL, {
      signal: controller.signal,
      // La planilla responde con max-age=300: sin esto el navegador nos
      // devolvería la copia cacheada y no veríamos los cambios a tiempo.
      cache: 'no-store',
      headers: { Accept: 'text/csv, text/plain, */*' },
    })
    clearTimeout(timeoutId)
  } catch (err) {
    return {
      text: null,
      reason:
        err?.name === 'AbortError'
          ? 'Tiempo de espera agotado al conectar con Google Sheets.'
          : 'Error al intentar cargar los datos desde Google Sheets.',
    }
  }

  if (!response || !response.ok) {
    return {
      text: null,
      reason: `No se pudieron obtener los productos (estado ${response?.status ?? 'desconocido'}).`,
    }
  }

  try {
    return { text: await response.text() }
  } catch {
    return { text: null, reason: 'La respuesta de Google Sheets no se pudo leer como texto.' }
  }
}

/** Pide el CSV público y devuelve { ok, data } o { ok: false, reason }. */
async function loadSheetProducts() {
  if (!GOOGLE_SHEETS_CSV_URL || GOOGLE_SHEETS_CSV_URL.length < 5) {
    return { ok: false, reason: 'Sin URL de Google Sheets configurada.' }
  }

  const { text, reason } = await loadSheetText()

  if (!text) {
    return { ok: false, reason: reason || 'La hoja de cálculo devolvió una respuesta vacía.' }
  }

  if (!text.trim()) {
    return { ok: false, reason: 'La hoja de cálculo devolvió una respuesta vacía.' }
  }

  // El CSV se parte en registros, no en líneas: una descripción con un salto de
  // línea dentro de comillas partía la fila y descuadraba todas las de abajo.
  const records = parseCsvRecords(text).filter((record) => record.some((cell) => cell !== ''))
  if (records.length < 2) {
    return { ok: false, reason: 'La hoja de cálculo no contiene filas de producto.' }
  }

  const header = records[0].map((column) => column.trim().toLowerCase())

  const requiredColumns = ['name', 'category', 'price', 'status']
  const missing = requiredColumns.filter((column) => !header.includes(column))
  if (missing.length) {
    return {
      ok: false,
      reason: `La hoja de cálculo no tiene las columnas necesarias: ${missing.join(', ')}. Usando catálogo local.`,
    }
  }

  const rows = records
    .slice(1)
    .map((record, index) => mapSheetRow(record, header, index))
    .filter(Boolean)

  if (!rows.length) {
    return { ok: false, reason: 'La hoja de cálculo no tiene filas de producto. Usando catálogo local.' }
  }

  // Solo se publican los productos con active = TRUE; el resto queda oculto.
  // Orden descendente por id: los productos nuevos (id más alto) aparecen primero.
  const products = dedupeById(rows.filter((row) => row.active)).sort(compareByIdDesc)

  return { ok: true, data: products, hidden: rows.length - products.length }
}

/** Si dos filas comparten id, se queda la primera (la de arriba de la planilla). */
function dedupeById(rows) {
  const seen = new Set()
  return rows.filter((row) => {
    if (seen.has(row.id)) return false
    seen.add(row.id)
    return true
  })
}

/** Ordena por id descendente, numéricamente cuando los ids son números. */
function compareByIdDesc(a, b) {
  const numberA = Number(a.id)
  const numberB = Number(b.id)
  const bothNumeric = Number.isFinite(numberA) && Number.isFinite(numberB)

  if (bothNumeric) return numberB - numberA

  return String(b.id).localeCompare(String(a.id), undefined, { numeric: true, sensitivity: 'base' })
}

/** Firma del catálogo: cambia si cambia cualquier dato visible de un producto. */
function signatureOf(products) {
  return JSON.stringify(
    products.map((product) => [
      product.id,
      product.name,
      product.category,
      product.price,
      product.status,
      product.image,
      product.video,
      product.description,
      product.featured,
      (product.colors ?? []).map((color) => [color?.name, color?.hex]),
    ]),
  )
}

/** Convierte una fila del CSV en el modelo de producto del frontend. */
function mapSheetRow(values, header, index) {
  const row = {}
  header.forEach((column, columnIndex) => {
    row[column] = values[columnIndex] !== undefined ? values[columnIndex] : ''
  })

  const name = String(row.name ?? '').trim()
  // Filas de relleno (id solo, sin nombre) no son productos.
  if (!name) return null

  const id = String(row.id ?? '').trim() || `producto-${index + 1}`

  return {
    id,
    name,
    category: normalizeCategoryId(row.category),
    price: normalizeSheetPrice(row.price),
    status: normalizeSheetStatus(row.status),
    image: normalizeSheetImage(row.image),
    video: normalizeSheetVideo(row.video),
    description: String(row.description ?? '').trim(),
    colors: normalizeSheetColors(row.colors),
    featured: toBoolean(row.featured),
    // Si la planilla no tiene la columna active, no se oculta nada: el
    // catálogo entero se publicaba vacío por ese detalle.
    active: header.includes('active') ? toBoolean(row.active) : true,
    fromSheet: true,
  }
}

/** Catálogo local, con la misma forma que devuelve Google Sheets. */
function normalizeLocalProducts(products) {
  return (products || []).map((product) => ({
    id: String(product.id ?? '').trim(),
    name: String(product.name ?? '').trim(),
    // Misma normalización que la planilla: el respaldo tiene que caer en los
    // mismos estantes, o al caer la red el cliente ve otro catálogo.
    category: normalizeCategoryId(product.category),
    price: Number(product.price) || 0,
    status: String(product.status ?? '').toLowerCase() === 'stock' ? 'stock' : 'pedido',
    image: normalizeSheetImage(product.image),
    video: normalizeSheetVideo(product.video),
    description: String(product.description ?? '').trim(),
    colors: Array.isArray(product.colors)
      ? product.colors.map((color) => {
          const name = String(color?.name ?? '').trim()
          return {
            name,
            hex: normalizeColorValue(color?.hex) || hexFromColorName(name),
          }
        })
      : [],
    featured: Boolean(product.featured),
    active: product.active === undefined ? true : Boolean(product.active),
    fromSheet: false,
  }))
}

// ─── Normalizadores ──────────────────────────────────────────────────────────

/** Precio en formato argentino ("$8,000" -> 8000) a entero. */
function normalizeSheetPrice(raw) {
  if (raw == null || raw === '') return 0
  if (typeof raw === 'number') return Math.round(raw)

  let value = String(raw).trim().replace(/[^\d.,-]/g, '')
  if (!value) return 0

  const lastComma = value.lastIndexOf(',')
  const lastDot = value.lastIndexOf('.')

  if (lastComma > -1 && lastDot > -1) {
    // El separador decimal es el último que aparece.
    if (lastComma > lastDot) value = value.replace(/\./g, '').replace(',', '.')
    else value = value.replace(/,/g, '')
  } else if (lastComma > -1) {
    // "8,000" es miles; "8,50" es decimal.
    value = /,\d{3}(?:\D|$)/.test(value) ? value.replace(/,/g, '') : value.replace(',', '.')
  } else if (lastDot > -1 && /^\d{1,3}(?:\.\d{3})+$/.test(value)) {
    value = value.replace(/\./g, '')
  }

  const asNumber = Number(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(asNumber) ? Math.round(asNumber) : 0
}

/** Estado de la planilla ("En Stock", "stock", "A Pedido"...) -> stock | pedido. */
function normalizeSheetStatus(raw) {
  const value = stripAccents(String(raw ?? '').trim().toLowerCase())
  if (!value) return 'pedido'
  if (value.includes('stock') || value === 'disponible' || value === 'inmediato') return 'stock'
  return 'pedido'
}

/**
 * Imagen de la planilla. Acepta las tres formas en las que el dueño escribe
 * la foto, porque cada una fallaba distinto:
 *
 *   1. URL directa      https://sitio.com/foto.jpg  -> se usa tal cual
 *   2. Ruta local       /products/foto.jpg          -> se usa tal cual
 *   3. NOMBRE DE ARCHIVO  foto.jpg, "boca - copia.jpg", clip.webm
 *      Antes se descartaba y salía el placeholder aunque el archivo estuviera
 *      subido: ahora se busca en /products/, que es donde se publican las
 *      fotos y los clips del proyecto.
 *   4. Link de Google Drive  .../file/d/ID/view?usp=drive_link
 *      Drive devuelve una página HTML, no la imagen, así que el <img> fallaba.
 *      Se convierte al CDN de contenido (lh3.../d/ID=w1200), que entrega la
 *      foto en un solo salto. Ojo: hay que pedirla sin referrer (ver
 *      ProductCard) porque si no Chrome la bloquea con ERR_BLOCKED_BY_ORB.
 *
 * Los videos (.webm, .mp4, .mov...) SÍ pasan: la tarjeta los detecta con
 * `isVideoSource` y renderiza un <video> en lugar de un <img>.
 *
 * Ojo con Drive: un link de Drive no dice si el archivo es foto o video, así
 * que siempre se resuelve como imagen (miniatura). Un video en Drive se ve
 * como un cuadro fijo; para reproducirlo hay que publicarlo como URL directa.
 */
export function normalizeSheetImage(raw) {
  let value = String(raw ?? '').trim()
  if (!value) return PLACEHOLDER_IMAGE

  // Celda con fórmula exportada como texto (=IMAGE("https://...")).
  if (value.startsWith('=')) {
    const insideFormula = value.match(/https?:\/\/[^"'\s,)]+/i)
    if (!insideFormula) return PLACEHOLDER_IMAGE
    value = insideFormula[0]
  }

  // Drive: la foto tiene que estar compartida como "cualquier persona con el
  // enlace", si no la imagen también pide login.
  const driveUrl = driveImageUrl(value)
  if (driveUrl) return driveUrl

  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`
  if (value.startsWith('/')) return value

  // Nombre de archivo suelto (foto o clip): se publica desde public/products/.
  if (hasMediaExtension(value)) {
    return `/products/${value
      .split('/')
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join('/')}`
  }

  return PLACEHOLDER_IMAGE
}

/**
 * Clip de la columna `video`.
 *
 *   - Link de Drive  -> URL del reproductor embebido (iframe).
 *   - Archivo/URL con extensión de video -> se usa tal cual (o /products/ si es
 *     un nombre suelto).
 *   - Vacío o cualquier otra cosa -> sin video (la tarjeta muestra solo la foto).
 */
export function normalizeSheetVideo(raw) {
  const value = String(raw ?? '').trim()
  if (!value) return ''

  const preview = drivePreviewUrl(value)
  if (preview) return preview

  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`
  if (value.startsWith('/')) return value

  // Solo un archivo de VIDEO entra en la columna `video`: una foto ahí es un
  // error de carga, no un clip.
  if (isVideoSource(value)) {
    return `/products/${value
      .split('/')
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join('/')}`
  }

  return ''
}

/**
 * Colores de la planilla: "Blanco, Negro" o "Blanco:#FFFFFF, Negro" -> [{ name, hex }]
 *
 * El parseo vive en config/colors.js: es el único lugar que conoce el
 * diccionario de filamento (incluidos los degradados y el rgba de
 * "transparente"), así que la planilla, la copia local y el respaldo leen los
 * colores igual.
 */
function normalizeSheetColors(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map((color) => {
        const name = String(color?.name ?? '').trim()
        if (!name) return null
        return {
          name,
          hex: normalizeColorValue(color?.hex) || hexFromColorName(name),
        }
      })
      .filter(Boolean)
  }

  if (typeof raw !== 'string') return []

  return parseFilamentColors(raw).map((color) => ({ name: color.name, hex: color.hex }))
}

/** Booleans de la planilla: TRUE, Sí, 1, X... */
function toBoolean(raw) {
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'number') return raw !== 0
  const value = stripAccents(String(raw ?? '').trim().toLowerCase())
  if (!value) return false
  return ['true', '1', 'si', 'yes', 'x', 'verdadero'].includes(value)
}

/**
 * Parte el CSV en registros respetando comillas. A diferencia de dividir por
 * líneas, un texto con un salto de línea dentro de comillas no rompe la fila
 * ni descuadra las filas siguientes.
 */
function parseCsvRecords(text) {
  const records = []
  let record = []
  let field = ''
  let quotedField = false
  let inQuotes = false

  const pushField = () => {
    record.push(quotedField ? field : field.trim())
    field = ''
    quotedField = false
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      // Solo cuenta como campo entrecomillado si la comilla abre el campo.
      if (field.trim() === '') {
        field = ''
        quotedField = true
      }
      inQuotes = true
      continue
    }

    if (char === ',') {
      pushField()
      continue
    }

    if (char === '\r') {
      if (next === '\n') i += 1
      pushField()
      records.push(record)
      record = []
      continue
    }

    if (char === '\n') {
      pushField()
      records.push(record)
      record = []
      continue
    }

    field += char
  }

  // Última fila (el archivo puede no terminar en salto de línea).
  if (field !== '' || record.length) {
    pushField()
    records.push(record)
  }

  return records
}

/** Quita tildes para comparar textos (muñeco -> muneco). */
function stripAccents(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
