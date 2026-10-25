/**
 * Prueba del polling del catálogo.
 *
 * Intercepta la respuesta de Google Sheets y, a partir de la segunda consulta,
 * sirve una versión con otro precio y un producto nuevo. Comprueba que la web
 * se actualiza sola, sin recargar la pestaña.
 *
 * Levantar el dev server con el polling acelerado:
 *   VITE_SHEETS_POLL_MS=4000 npx vite --port 5199
 *   node scripts/verify-polling.mjs http://localhost:5199/
 */
import { chromium } from 'playwright'
import { GOOGLE_SHEETS_CSV_URL } from '../src/config/constants.js'

const url = process.argv[2] ?? process.env.URL ?? 'http://localhost:5199/'

const realCsv = await fetch(GOOGLE_SHEETS_CSV_URL).then((response) => response.text())
const lines = realCsv.split(/\r?\n/)

// Versión 2: mismo catálogo con otro precio + un producto nuevo.
const header = splitCsvLine(lines[0])
const priceIndex = header.indexOf('price')
const idIndex = header.indexOf('id')
const firstProductRow = lines.findIndex((line, index) => index > 0 && splitCsvLine(line)[1]?.trim())
const priceCells = splitCsvLine(lines[firstProductRow])
const oldPrice = priceCells[priceIndex]
priceCells[priceIndex] = '$9.999'

// El id tiene que ser nuevo: si se repite, la web descarta el duplicado.
const nextId =
  Math.max(
    ...lines
      .slice(1)
      .map((line) => Number(splitCsvLine(line)[idIndex]) || 0),
  ) + 1

const patchedCsv = [
  ...lines.map((line, index) => (index === firstProductRow ? joinCsvLine(priceCells) : line)),
  `${nextId},Producto Polling,juguetes,"$7,777",stock,,TRUE,"Rojo, Azul",Nuevo en la planilla,TRUE`,
].join('\n')

let served = 0
let current = realCsv

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
const consoleErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})

await page.route('**/*output=csv*', async (route) => {
  served += 1
  // A partir de la segunda consulta servimos la planilla "modificada".
  if (served >= 2) current = patchedCsv
  await route.fulfill({ status: 200, contentType: 'text/csv; charset=utf-8', body: current })
})

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page
  .waitForFunction(
    () => /LISTADO EN VIVO DESDE LA PLANILLA|CATÁLOGO LOCAL DE RESPALDO/.test(document.body.innerText),
    { timeout: 25000 },
  )
  .catch(() => console.log('! el catálogo no llegó a resolverse después de 25s'))

// Marca la página para detectar recargas.
await page.evaluate(() => {
  window.__noReload = true
})

const before = await page.evaluate(() => ({
  text: document.body.innerText,
  reloaded: window.__noReload !== true,
}))

console.log(`Precio original en la planilla: ${oldPrice}`)
console.log(`Consultas servidas hasta ahora: ${served}`)

// Damos tiempo a que el polling pregunte de nuevo.
await page.waitForTimeout(14000)

const after = await page.evaluate(() => ({
  hasNewPrice: document.body.innerText.includes('$9.999'),
  hasNewProduct: document.body.innerText.includes('Producto Polling'),
  reloaded: window.__noReload !== true,
  updatedStamp: document.body.innerText.match(/ACTUALIZADO\s+(\d{2}:\d{2}:\d{2})/)?.[1] ?? null,
  productNames: [...new Set([...document.querySelectorAll('.product-card h3')].map((n) => n.innerText.trim()))],
}))

console.log(`\nConsultas servidas en total: ${served}`)
console.log(`Precio nuevo ($9.999) en pantalla: ${after.hasNewPrice}`)
console.log(`Producto nuevo en pantalla: ${after.hasNewProduct}`)
console.log(`La página se recargó: ${after.reloaded}`)
console.log(`Sello de última actualización: ${after.updatedStamp ?? 'no visible'}`)
console.log(`Productos visibles: ${after.productNames.length}`)

if (consoleErrors.length) {
  console.log('\nErrores de consola:')
  for (const error of consoleErrors) console.log(' !', error)
}

await browser.close()

const ok = served >= 2 && after.hasNewPrice && after.hasNewProduct && !after.reloaded
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

/** Vuelve a armar la línea CSV, entrecomillando lo que haga falta. */
function joinCsvLine(cells) {
  return cells
    .map((cell) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell))
    .join(',')
}
