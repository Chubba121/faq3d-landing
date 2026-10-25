/**
 * Prueba del filtro `active`:
 * intercepta la respuesta de Google Sheets y le cambia el `active` de una fila
 * a FALSE, para comprobar que ese producto deja de mostrarse (sin tocar la
 * planilla real).
 *
 *   node scripts/verify-active-filter.mjs [url]
 */
import { chromium } from 'playwright'
import { GOOGLE_SHEETS_CSV_URL } from '../src/config/constants.js'

const url = process.argv[2] ?? process.env.URL ?? 'http://localhost:5173/'

const realCsv = await fetch(GOOGLE_SHEETS_CSV_URL).then((response) => response.text())
const lines = realCsv.split(/\r?\n/)

const header = splitCsvLine(lines[0])
const activeIndex = header.indexOf('active')
const nameIndex = header.indexOf('name')

// Primera fila con nombre: le cambiamos active a FALSE.
const target = lines.findIndex((line, index) => index > 0 && splitCsvLine(line)[nameIndex]?.trim())
const targetName = splitCsvLine(lines[target])[nameIndex].trim()
const cells = splitCsvLine(lines[target])
cells[activeIndex] = 'FALSE'

const patchedCsv = lines
  .map((line, index) => (index === target ? joinCsvLine(cells) : line))
  .join('\n')

console.log(`Fila marcada como active=FALSE: "${targetName}" (fila ${target + 1})`)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })

await page.route('**/*output=csv*', (route) =>
  route.fulfill({ status: 200, contentType: 'text/csv; charset=utf-8', body: patchedCsv }),
)

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page
  .waitForFunction(
    () => /LISTADO EN VIVO DESDE LA PLANILLA|CATÁLOGO LOCAL DE RESPALDO/.test(document.body.innerText),
    { timeout: 25000 },
  )
  .catch(() => console.log('! el catálogo no llegó a resolverse después de 25s'))

const result = await page.evaluate((hiddenName) => {
  const names = [...document.querySelectorAll('.product-card h3')].map((node) => node.innerText.trim())
  return {
    visible: names.includes(hiddenName),
    hiddenNote: document.body.innerText.match(/(\d+)\s+OCULTOS/)?.[1] ?? null,
    unique: [...new Set(names)].length,
  }
}, targetName)

await browser.close()

// La planilla puede tener más de una fila oculta (borradores, pruebas): el
// aviso tiene que decir cuántas son, no el 1 fijo que asumía esta prueba.
const expectedHidden = patchedCsv
  .split(/\r?\n/)
  .slice(1)
  .map(splitCsvLine)
  .filter((cells) => cells[nameIndex]?.trim())
  .filter((cells) => !['true', '1', 'si', 'yes', 'x', 'verdadero'].includes(String(cells[activeIndex] ?? '').trim().toLowerCase()))
  .length

const ok = !result.visible && result.hiddenNote === String(expectedHidden)
console.log(`Producto "${targetName}" visible: ${result.visible} (esperado: false)`)
console.log(`Aviso de ocultos: ${result.hiddenNote} (esperado: ${expectedHidden})`)
console.log(`Productos visibles: ${result.unique}`)
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
