/**
 * Verificación del primer pintado del catálogo.
 *
 * Comprueba las dos situaciones en las que el catálogo puede aparecer mal:
 *
 *  1. Carga en frío (sin copia guardada): mientras llega la planilla no se debe
 *     mostrar el catálogo local de respaldo (productos y precios que pueden no
 *     existir) ni marcar un estante como vacío.
 *  2. Recarga (con copia guardada): el primer pintado ya tiene que mostrar los
 *     modelos reales de la planilla, incluidos los de la categoría de
 *     referencia, sin parpadeo de datos falsos.
 *
 * La lista de productos se lee de la planilla real: cualquier producto en
 * pantalla que no esté en la planilla es un dato falso.
 *
 *   node scripts/verify-first-paint.mjs [url]
 */
import { chromium } from 'playwright'
import { GOOGLE_SHEETS_CSV_URL } from '../src/config/constants.js'
import { normalizeCategoryId } from '../src/config/categories.js'
import { CATEGORIES } from '../src/data/products.js'

const url = process.argv[2] ?? process.env.URL ?? 'http://localhost:5173/'

// Productos publicados en la planilla (los que active = TRUE).
const sheetCsv = await fetch(GOOGLE_SHEETS_CSV_URL).then((response) => response.text())
const sheetRows = splitCsvLine(sheetCsv.split(/\r?\n/)[0])
const sheetProducts = sheetCsv
  .split(/\r?\n/)
  .slice(1)
  .map((line) => splitCsvLine(line))
  .filter((cells) => cells[1]?.trim())
  .filter((cells) => {
    const active = cells[cells.length - 1]?.trim().toLowerCase()
    return active === 'true'
  })
  .map((cells) => cells[1].trim())

// Categoría de referencia para las comprobaciones. Antes estaba fija en
// "Muñecos & Figuras", pero si el dueño deja esa categoría sin modelos el
// estante queda vacío por datos y no por un bug: la prueba elegía un producto
// que podía desaparecer. Ahora se usa la primera categoría del sitio que tenga
// modelos publicados, y se acepta como vacío solamente el estante de una
// categoría que hoy no vende nada.
const publishedRows = sheetCsv
  .split(/\r?\n/)
  .slice(1)
  .map((line) => splitCsvLine(line))
  .filter((cells) => cells[1]?.trim())
  .filter((cells) => (cells[cells.length - 1] ?? '').trim().toLowerCase() === 'true')
  .map((cells) => ({ name: cells[1].trim(), category: normalizeCategoryId(cells[2]) }))

const categoryCounts = new Map()
for (const item of publishedRows) {
  categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1)
}

const referenceCategory =
  CATEGORIES.find((category) => (categoryCounts.get(category.id) ?? 0) > 0) ?? CATEGORIES[0]
const referenceShelfId = `catalogo-categoria-${referenceCategory.id}`
const emptyByData = CATEGORIES.filter((category) => !categoryCounts.get(category.id)).map(
  (category) => `catalogo-categoria-${category.id}`,
)

/** Un estante solo puede estar vacío si su categoría no tiene modelos. */
const onlyExpectedEmpty = (shelfIds) => shelfIds.every((id) => emptyByData.includes(id))

console.log(`Planilla: ${sheetProducts.length} productos publicados`)
console.log(
  `Categoría de referencia: ${referenceCategory.label} (${categoryCounts.get(referenceCategory.id) ?? 0} modelos)`,
)
if (emptyByData.length) console.log(`Categorías sin modelos publicados: ${emptyByData.join(', ')}`)

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
const page = await context.newPage()

const consoleErrors = []
// Cuando se corta la red a propósito, el navegador loguea el fallo del
// pedido: no es un error de la web, así que deja de contarse.
let networkBlocked = false
page.on('console', (message) => {
  if (message.type() !== 'error') return
  if (networkBlocked) return
  consoleErrors.push(message.text())
})

/** Lee lo que hay pintado en este momento. */
const readState = () =>
  page.evaluate(() => {
    const shelves = [...document.querySelectorAll('[id^="catalogo-categoria-"]')].map((shelf) => ({
      id: shelf.id,
      title: shelf.querySelector('h3')?.innerText?.trim() ?? '',
      names: [...shelf.querySelectorAll('.product-card h3')].map((node) => node.innerText.trim()),
      empty: Boolean(shelf.querySelector('#catalogo-sin-productos')),
    }))
    return {
      shelves,
      body: document.body.innerText,
      origin:
        document.body.innerText.match(
          /LISTADO EN VIVO DESDE LA PLANILLA|CATÁLOGO LOCAL DE RESPALDO|CONECTANDO CON LA PLANILLA/,
        )?.[0] ?? null,
      loading: /CONECTANDO CON LA PLANILLA/i.test(document.body.innerText),
    }
  })

/** Productos mostrados que no existen en la planilla. */
const foreignProducts = (state) =>
  state.shelves.flatMap((shelf) => shelf.names).filter((name) => !sheetProducts.includes(name))

// ── 1. Carga en frío ────────────────────────────────────────────────────────
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })

const coldFirst = await readState()
const coldForeign = foreignProducts(coldFirst)
const coldEmptyShelves = coldFirst.shelves.filter((shelf) => shelf.empty).map((shelf) => shelf.id)

console.log('\n── Carga en frío ──')
console.log(`Primer pintado: ${coldFirst.shelves.length} estantes · estado="${coldFirst.origin}"`)
console.log(`Productos en pantalla que no están en la planilla: ${coldForeign.length}`)
console.log(`Estantes marcados como vacíos: ${coldEmptyShelves.length ? coldEmptyShelves.join(', ') : 'ninguno'}`)

await page.waitForFunction(() => /LISTADO EN VIVO DESDE LA PLANILLA/.test(document.body.innerText), {
  timeout: 25000,
})

const coldLoaded = await readState()
const coldLoadedForeign = foreignProducts(coldLoaded)
const referenceSheet = coldLoaded.shelves.find((shelf) => shelf.id === referenceShelfId)
const emptyAfterLoad = coldLoaded.shelves.filter((shelf) => shelf.empty).map((shelf) => shelf.id)

console.log(`Después de cargar: estado="${coldLoaded.origin}"`)
console.log(`Productos que no están en la planilla: ${coldLoadedForeign.length}`)
console.log(
  `Estante "${referenceCategory.label}": ${referenceSheet?.names.length ?? 0} modelo(s) -> ${referenceSheet?.names.join(', ') || 'vacío'}`,
)

// ── 2. Recarga (con la copia guardada) ──────────────────────────────────────
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })

const warmFirst = await readState()
const warmForeign = foreignProducts(warmFirst)
const warmReference = warmFirst.shelves.find((shelf) => shelf.id === referenceShelfId)
const warmEmptyShelves = warmFirst.shelves.filter((shelf) => shelf.empty).map((shelf) => shelf.id)

console.log('\n── Recarga (con copia guardada) ──')
console.log(`Primer pintado: estado="${warmFirst.origin}"`)
console.log(`Productos en pantalla que no están en la planilla: ${warmForeign.length}`)
console.log(
  `Estante "${referenceCategory.label}" en el primer pintado: ${warmReference?.names.length ?? 0} modelo(s) -> ${warmReference?.names.join(', ') || 'vacío'}`,
)
console.log(`Estantes marcados como vacíos: ${warmEmptyShelves.length ? warmEmptyShelves.join(', ') : 'ninguno'}`)

await page.waitForFunction(() => /LISTADO EN VIVO DESDE LA PLANILLA/.test(document.body.innerText), {
  timeout: 25000,
})
const warmLoaded = await readState()
const warmReferenceAfter = warmLoaded.shelves.find((shelf) => shelf.id === referenceShelfId)
console.log(
  `Después de refrescar la planilla: ${warmReferenceAfter?.names.length ?? 0} modelo(s) -> ${warmReferenceAfter?.names.join(', ') || 'vacío'}`,
)

// ── 3. Copia local vieja (categoría sin normalizar) + planilla inaccesible ──
// Es el caso real que rompía la web: una copia guardada por una versión
// anterior traía la categoría tal cual la escribe la planilla
// ("Muñecos & Figuras"). Al recargar, ese producto no entraba en su estante
// y la categoría aparecía vacía hasta que llegaba la planilla. Con la red
// cortada, la copia es la única fuente: el estante tiene que salir igual.
const poison = await page.evaluate(
  ({ refId, refLabel }) => {
    const key = 'faq3d:catalog:v2'
    const raw = window.localStorage.getItem(key)
    if (!raw) return { ok: false }

    const parsed = JSON.parse(raw)
    parsed.products = parsed.products.map((product) =>
      product.category === refId ? { ...product, category: refLabel } : product,
    )
    // Firma vieja: la copia se cree intacta y no se repinta al leerla.
    parsed.signature = 'firma-vieja'
    window.localStorage.setItem(key, JSON.stringify(parsed))
    return { ok: true, count: parsed.products.length }
  },
  { refId: referenceCategory.id, refLabel: referenceCategory.label },
)

await page.route('**docs.google.com/**', (route) => route.abort())
networkBlocked = true
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector(`#${referenceShelfId}`, { timeout: 20000 })

const staleFirst = await readState()
const staleReference = staleFirst.shelves.find((shelf) => shelf.id === referenceShelfId)
const staleForeign = foreignProducts(staleFirst)
const staleEmptyShelves = staleFirst.shelves.filter((shelf) => shelf.empty).map((shelf) => shelf.id)

console.log('\n── Copia vieja (sin planilla) ──')
console.log(`Copia envenenada: ${poison.ok ? `${poison.count} productos` : 'no se pudo preparar'}`)
console.log(
  `Estante "${referenceCategory.label}" en el primer pintado: ${staleReference?.names.length ?? 0} modelo(s) -> ${staleReference?.names.join(', ') || 'vacío'}`,
)
console.log(`Productos que no están en la planilla: ${staleForeign.length}`)
console.log(`Estantes marcados como vacíos: ${staleEmptyShelves.length ? staleEmptyShelves.join(', ') : 'ninguno'}`)

await page.unroute('**docs.google.com/**')
await page.screenshot({ path: '.screens/verify-first-paint.png', fullPage: false })
await browser.close()

if (consoleErrors.length) {
  console.log('\nErrores de consola:')
  for (const error of consoleErrors) console.log(' !', error)
}

const checks = [
  [
    'carga en frío: mientras carga no se muestra el catálogo local de respaldo',
    coldFirst.origin !== 'CATÁLOGO LOCAL DE RESPALDO',
  ],
  ['carga en frío: ningún producto ajeno a la planilla', coldForeign.length === 0 && coldLoadedForeign.length === 0],
  [
    'carga en frío: ningún estante vacío salvo categorías sin modelos',
    onlyExpectedEmpty([...coldEmptyShelves, ...emptyAfterLoad]),
  ],
  [
    `carga en frío: "${referenceCategory.label}" trae los modelos de la planilla`,
    (referenceSheet?.names.length ?? 0) > 0,
  ],
  ['recarga: el primer pintado ya trae el catálogo real', (warmReference?.names.length ?? 0) > 0],
  ['recarga: el origen es la planilla, no el respaldo', warmFirst.origin === 'LISTADO EN VIVO DESDE LA PLANILLA'],
  ['recarga: ningún producto ajeno a la planilla', warmForeign.length === 0],
  [
    'recarga: ningún estante vacío salvo categorías sin modelos',
    onlyExpectedEmpty(warmEmptyShelves),
  ],
  [
    'recarga: el catálogo no cambia al refrescar la planilla',
    JSON.stringify(warmReference?.names) === JSON.stringify(warmReferenceAfter?.names),
  ],
  [
    `copia vieja: "${referenceCategory.label}" aparece igual sin planilla`,
    (staleReference?.names.length ?? 0) > 0,
  ],
  ['copia vieja: ningún producto ajeno a la planilla', staleForeign.length === 0],
  [
    'copia vieja: ningún estante vacío salvo categorías sin modelos',
    onlyExpectedEmpty(staleEmptyShelves),
  ],
  ['sin errores de consola', consoleErrors.length === 0],
]

console.log('')
for (const [label, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${label}`)

const ok = checks.every(([, passed]) => passed)
console.log(`\nResultado: ${ok ? 'OK' : 'FALLA'}`)
process.exit(ok ? 0 : 1)

/** Parte una línea CSV en celdas, respetando las comillas. */
function splitCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}
