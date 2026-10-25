/**
 * Verificación del catálogo en vivo.
 *
 * Abre la landing en un navegador real y comprueba que la lista de productos
 * publicada en Google Sheets se está mostrando (y no el catálogo local), que
 * solo se publican los productos con active = TRUE, y que el carrusel del hero
 * se aut reproduce y tiene flechas en desktop.
 *
 *   node scripts/verify-catalog.mjs [url]
 */
import { chromium } from 'playwright'
import { GOOGLE_SHEETS_CSV_URL } from '../src/config/constants.js'

const url = process.argv[2] ?? process.env.URL ?? 'http://localhost:5173/'

// ── Lo que la planilla dice que debería verse ──────────────────────────────
const sheetCsv = await fetch(GOOGLE_SHEETS_CSV_URL).then((response) => response.text())
const sheetRows = parseCsv(sheetCsv)
const sheetHeader = (sheetRows[0] ?? []).map((column) => column.toLowerCase())
const nameIndex = sheetHeader.indexOf('name')
const activeIndex = sheetHeader.indexOf('active')

const expectedNames = sheetRows
  .slice(1)
  .filter((row) => (row[nameIndex] ?? '').trim())
  .filter((row) => isTrue(row[activeIndex]))
  .map((row) => (row[nameIndex] ?? '').trim())

const expectedHidden = sheetRows
  .slice(1)
  .filter((row) => (row[nameIndex] ?? '').trim())
  .filter((row) => !isTrue(row[activeIndex])).length

// Orden esperado en pantalla: id descendente (los nuevos primero).
const idIndex = sheetHeader.indexOf('id')
const expectedOrder = sheetRows
  .slice(1)
  .filter((row) => (row[nameIndex] ?? '').trim())
  .filter((row) => isTrue(row[activeIndex]))
  .map((row) => ({ id: (row[idIndex] ?? '').trim(), name: (row[nameIndex] ?? '').trim() }))
  .sort((a, b) => {
    const numberA = Number(a.id)
    const numberB = Number(b.id)
    if (Number.isFinite(numberA) && Number.isFinite(numberB)) return numberB - numberA
    return b.id.localeCompare(a.id, undefined, { numeric: true })
  })
  .map((entry) => entry.name)

// ── Navegador ───────────────────────────────────────────────────────────────
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })

const consoleErrors = []
const failedRequests = []
const sheetResponses = []

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('requestfailed', (request) => {
  failedRequests.push(`${request.url()} :: ${request.failure()?.errorText ?? 'sin motivo'}`)
})
page.on('response', (response) => {
  if (response.status() >= 400) {
    failedRequests.push(`${response.url()} :: HTTP ${response.status()}`)
  }
  if (response.url().includes('docs.google.com') || response.url().includes('googleusercontent.com')) {
    sheetResponses.push(`${response.status()} ${response.url().slice(0, 120)}`)
  }
})

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })

// Espera a que el catálogo se resuelva (de la planilla o del respaldo local).
await page
  .waitForFunction(
    () => /LISTADO EN VIVO DESDE LA PLANILLA|CATÁLOGO LOCAL DE RESPALDO/.test(document.body.innerText),
    { timeout: 25000 },
  )
  .catch(() => console.log('! el catálogo no llegó a resolverse después de 25s'))

const report = await page.evaluate(() => {
  const upper = document.body.innerText.toUpperCase()
  const cards = [...document.querySelectorAll('.product-card')].map((card) => {
    const image = card.querySelector('img')
    return {
      name: card.querySelector('h3')?.innerText?.trim() ?? '',
      price: card.querySelector('.price')?.innerText?.trim() ?? '',
      status: card.querySelector('.stamp')?.innerText?.trim() ?? '',
      swatches: card.querySelectorAll('span[title]').length,
      image: image ? `${image.getAttribute('src')?.slice(0, 60)} (cargada=${image.naturalWidth > 0})` : 'sin img',
    }
  })
  const shelves = [...document.querySelectorAll('[id^="catalogo-categoria-"]')].map((shelf) => ({
    id: shelf.id,
    title: shelf.querySelector('h3')?.innerText?.trim() ?? '',
    count: shelf.querySelector('p')?.innerText?.trim() ?? '',
    names: [...shelf.querySelectorAll('.product-card h3')].map((node) => node.innerText.trim()),
  }))
  const region = document.querySelector('[aria-roledescription="carrusel"][aria-label="Productos destacados"]')
  const carousel = region
    ? {
        slides: region.querySelectorAll('[aria-roledescription="slide"]').length,
        offset: Math.round(region.firstElementChild.getBoundingClientRect().left),
        // Si todo entra en la pantalla no hay nada que desplazar.
        overflow: region.firstElementChild.scrollWidth > region.firstElementChild.clientWidth + 1,
        nextDisabled: document.querySelector('button[aria-label="Producto siguiente"]')?.disabled ?? null,
        arrows: [...document.querySelectorAll('button[aria-label="Producto anterior"], button[aria-label="Producto siguiente"]')].map(
          (button) => button.getAttribute('aria-label'),
        ),
      }
    : null

  return {
    source: upper.includes('LISTADO EN VIVO DESDE LA PLANILLA')
      ? 'CSV de Google Sheets'
      : upper.includes('CATÁLOGO LOCAL DE RESPALDO') || upper.includes('CATALOGO LOCAL DE RESPALDO')
        ? 'catálogo local de respaldo'
        : 'sin indicador de origen',
    hiddenNote: document.body.innerText.match(/(\d+)\s+OCULTOS/)?.[1] ?? null,
    heroStats: [...document.querySelectorAll('dl dt')].map((dt) => ({
      label: dt.innerText.trim(),
      value: dt.nextElementSibling?.innerText?.trim() ?? '',
    })),
    uniqueNames: [...new Set(cards.map((card) => card.name))],
    catalogNames: [...new Set(shelves.flatMap((shelf) => shelf.names))],
    cards,
    shelves,
    carousel,
  }
})

/** Lee la posición del carrusel del hero (para saber si se movió). */
const readHeroOffset = (target) =>
  target.evaluate(() => {
    const region = document.querySelector('[aria-roledescription="carrusel"][aria-label="Productos destacados"]')
    return region ? Math.round(region.firstElementChild.getBoundingClientRect().left) : null
  })

// El carrusel tiene que avanzar solo (autoplay).
await page.waitForTimeout(6000)
const autoOffset = await readHeroOffset(page)

// Estado de la flecha "siguiente" DESPUÉS de que Embla sincroniza. Leerlo en el
// primer pintado mide un transitorio (React todavía no recibió el evento
// `select`, así que la flecha aparece deshabilitada aunque después se habilite).
const nextDisabled = await page.evaluate(
  () => document.querySelector('button[aria-label="Producto siguiente"]')?.disabled ?? null,
)

// Y las flechas tienen que moverlo a mano (solo si hay algo que desplazar).
let arrowOffset = autoOffset
let arrowMoved = false
if (report.carousel?.overflow) {
  await page.click('button[aria-label="Producto siguiente"]')
  await page.waitForTimeout(700)
  arrowOffset = await readHeroOffset(page)
  arrowMoved = arrowOffset !== autoOffset
}

// En mobile los productos no entran todos en pantalla: el carrusel tiene que
// rotar solo (el swipe es con el dedo).
const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await mobilePage
  .waitForFunction(() => /LISTADO EN VIVO/.test(document.body.innerText), { timeout: 25000 })
  .catch(() => console.log('! la versión mobile no llegó a cargar la planilla'))
const mobileStart = await readHeroOffset(mobilePage)
await mobilePage.waitForTimeout(6000)
const mobileEnd = await readHeroOffset(mobilePage)
const mobileSlides = await mobilePage.evaluate(
  () =>
    document.querySelectorAll(
      '[aria-roledescription="carrusel"][aria-label="Productos destacados"] [aria-roledescription="slide"]',
    ).length,
)
await mobilePage.close()

await page.screenshot({ path: '.screens/catalog-csv.png', fullPage: true })

console.log('Origen del catálogo:', report.source)
console.log(
  'Stats hero:',
  report.heroStats.filter((s) => s.label).map((s) => `${s.label}=${s.value}`).join(' | '),
)
console.log('\nProductos en tarjetas:')
for (const card of report.uniqueNames) console.log(' -', card)
console.log('\nDetalle de cada tarjeta:')
for (const card of report.cards) {
  console.log(` - ${card.name} | ${card.price} | ${card.status} | colores=${card.swatches} | img=${card.image}`)
}
console.log('\nEstantes:')
for (const shelf of report.shelves) {
  console.log(` - ${shelf.title} (${shelf.count}): ${shelf.names.join(', ') || 'vacío'}`)
}

// ── Chequeos ────────────────────────────────────────────────────────────────
const missing = expectedNames.filter((name) => !report.catalogNames.includes(name))
const unexpected = report.catalogNames.filter((name) => !expectedNames.includes(name))

console.log('\nFiltro active=TRUE:')
console.log(` · esperados en la planilla: ${expectedNames.length} (ocultos: ${expectedHidden})`)
console.log(` · mostrados en el catálogo: ${report.catalogNames.length}`)
console.log(` · faltantes: ${missing.length ? missing.join(', ') : 'ninguno'}`)
console.log(` · no esperados: ${unexpected.length ? unexpected.join(', ') : 'ninguno'}`)

// Cada estante tiene que ir de id descendente (los nuevos primero).
// expectedOrder está ordenado por id descendente, así que dentro de un estante
// las posiciones tienen que ir en aumento.
const orderProblems = report.shelves.flatMap((shelf) => {
  const indexes = shelf.names.map((name) => expectedOrder.indexOf(name))
  return indexes
    .map((index, position) => (position > 0 && index < indexes[position - 1] ? shelf.title : null))
    .filter(Boolean)
})

console.log('\nOrden por id descendente:')
console.log(` · orden esperado: ${expectedOrder.join(' > ')}`)
console.log(
  ` · orden en pantalla: ${report.shelves
    .map((shelf) => shelf.names.join(' > '))
    .join(' | ')}`,
)
console.log(` · fuera de orden: ${orderProblems.length ? orderProblems.join(', ') : 'no'}`)

console.log('\nCarrusel del hero:')
console.log(` · slides: ${report.carousel?.slides ?? 0}`)
console.log(` · flechas: ${report.carousel?.arrows?.join(', ') || 'ninguna'}`)
console.log(
  ` · hay algo que desplazar: ${report.carousel?.overflow ? 'sí' : 'no (entra todo en pantalla)'}`,
)
console.log(` · autoplay: ${autoOffset !== null && autoOffset !== report.carousel?.offset ? 'avanza solo' : 'NO avanza'}`)
console.log(` · flecha siguiente: ${arrowMoved ? 'mueve el carrusel' : 'NO mueve'}`)
console.log(` · flecha siguiente habilitada: ${nextDisabled === false ? 'sí' : 'NO'}`)
console.log(
  ` · mobile (390px): ${mobileSlides} slides · ${mobileEnd !== mobileStart ? 'rota solo' : 'NO rota'}`,
)

if (sheetResponses.length) {
  console.log('\nRespuestas de Google Sheets:')
  for (const response of sheetResponses) console.log(' ·', response)
} else {
  console.log('\nNo hubo respuestas de Google Sheets (¿la petición no salió o fue bloqueada por CORS?).')
}

if (consoleErrors.length) {
  console.log('\nErrores de consola:')
  for (const error of consoleErrors) console.log(' !', error)
} else {
  console.log('\nSin errores de consola.')
}

const relevantFailures = failedRequests.filter((entry) => !entry.includes('img.magnific.com'))
if (relevantFailures.length) {
  console.log('\nPeticiones fallidas:')
  for (const failure of relevantFailures) console.log(' !', failure)
} else {
  console.log('Sin peticiones fallidas (salvo imágenes externas).')
}

await browser.close()

const fromSheet = report.source === 'CSV de Google Sheets'
const hasProducts = report.catalogNames.length > 0
const activeOk = missing.length === 0 && unexpected.length === 0
const orderOk = orderProblems.length === 0
// Si el carrusel tiene contenido que no entra en pantalla, tiene que rotar solo
// y las flechas tienen que moverlo. Si entra todo, las flechas quedan
// deshabilitadas (no hay botones muertos).
const carouselOk =
  report.carousel &&
  report.carousel.slides > 0 &&
  (report.carousel.overflow
    ? autoOffset !== report.carousel.offset &&
      arrowMoved &&
      nextDisabled === false &&
      mobileEnd !== mobileStart
    : nextDisabled === true)

console.log(
  `\nResultado: ${fromSheet && hasProducts && activeOk && orderOk && carouselOk ? 'OK' : 'FALLA'} - origen=${report.source}, productos=${report.catalogNames.length}, active=${activeOk ? 'ok' : 'falla'}, orden=${orderOk ? 'ok' : 'falla'}, carrusel=${carouselOk ? 'ok' : 'falla'}`,
)

process.exit(fromSheet && hasProducts && activeOk && orderOk && carouselOk ? 0 : 1)

// ─── Utilidades ──────────────────────────────────────────────────────────────

/** TRUE / 1 / Sí / X -> true. */
function isTrue(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return ['true', '1', 'si', 'yes', 'x', 'verdadero'].includes(normalized)
}

/** Parser de CSV con comillas (suficiente para la planilla de Faq3D). */
function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
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
    })
}
