/**
 * Verificación del diccionario de colores de filamento.
 *
 * Comprueba dos cosas:
 *
 *  1. Que TODOS los colores del diccionario se reconozcan al leer la columna
 *     `colors` de Google Sheets ("Blanco, Verde Fluor", "Marrón", "Pastel Rosa",
 *     "Blanco:#FFFFFF", etc.) y devuelvan su valor canónico.
 *  2. Que los efectos especiales (degradados y "transparente") lleguen intactos
 *     a la pantalla: no basta con que el color se resuelva, también tiene que
 *     pintarse. Para eso se sirve una planilla de mentira con una fila que usa
 *     esos colores y se mira el DOM.
 *
 *   node scripts/verify-colors.mjs [url]
 */
import { chromium } from 'playwright'
import {
  FILAMENT_COLOR_MAP,
  parseFilamentColors,
  hexFromColorName,
  normalizeColorValue,
} from '../src/config/colors.js'
import { GOOGLE_SHEETS_CSV_URL } from '../src/config/constants.js'

const url = process.argv[2] ?? process.env.URL ?? 'http://localhost:4173/'

// ── 1. Diccionario: cada clave se reconoce como se escribe en la planilla ──
const checks = []

/** "verde fluor" -> "Verde fluor" (como lo escribe una persona). */
const asWritten = (key) => key.charAt(0).toUpperCase() + key.slice(1)

for (const [key, expected] of Object.entries(FILAMENT_COLOR_MAP)) {
  const written = asWritten(key)

  // 1a. Tal cual lo escribe la persona.
  const parsed = parseFilamentColors(written)
  checks.push([
    `"${written}" se reconoce`,
    parsed.length === 1 && parsed[0].hex === expected,
    `-> ${parsed[0]?.hex ?? '(sin valor)'}`,
  ])

  // 1b. En minúsculas y con mayúsculas.
  checks.push([
    `"${written}" en minúsculas/mayúsculas`,
    hexFromColorName(written.toLowerCase()) === expected && hexFromColorName(written.toUpperCase()) === expected,
    '',
  ])

  // 1c. El valor del diccionario es un color CSS válido.
  checks.push([
    `el valor de "${written}" es un color válido`,
    normalizeColorValue(expected) === expected,
    `-> ${expected}`,
  ])
}

// 1d. Acentos: la planilla puede escribir "Marrón", "Azul Francia", etc.
const withAccents = [
  ['Marrón', 'marron'],
  ['Verde Fluór', 'verde fluor'],
  ['Pastel Rosa', 'pastel rosa'],
  ['Amarillo Flúor', 'amarillo fluor'],
  ['AZUL FRANCIA', 'azul francia'],
]
for (const [written, key] of withAccents) {
  checks.push([
    `"${written}" se reconoce (con acentos/mayúsculas)`,
    hexFromColorName(written) === FILAMENT_COLOR_MAP[key],
    `-> ${hexFromColorName(written) || '(sin valor)'}`,
  ])
}

// 1e. La forma "Nombre:#FFFFFF" sigue funcionando.
checks.push([
  '"Blanco:#123456" usa el valor explícito',
  parseFilamentColors('Blanco:#123456')[0]?.hex === '#123456',
  `-> ${parseFilamentColors('Blanco:#123456')[0]?.hex}`,
])
checks.push([
  '"Multicolor" conserva el degradado',
  parseFilamentColors('Multicolor')[0]?.hex?.startsWith('linear-gradient('),
  `-> ${parseFilamentColors('Multicolor')[0]?.hex}`,
])
checks.push([
  '"Transparente" conserva el rgba',
  parseFilamentColors('Transparente')[0]?.hex?.startsWith('rgba('),
  `-> ${parseFilamentColors('Transparente')[0]?.hex}`,
])

console.log('── Diccionario ──')
for (const [label, ok, detail] of checks) {
  if (!ok) console.log(`✗ ${label} ${detail}`)
}
console.log(
  `${checks.filter(([, ok]) => ok).length}/${checks.length} comprobaciones del diccionario correctas`,
)

// ── 2. Planilla real: los efectos especiales llegan pintados a la pantalla ──
const realCsv = await fetch(GOOGLE_SHEETS_CSV_URL).then((response) => response.text())
const lines = realCsv.split(/\r?\n/)
const header = lines[0]
const nextId =
  Math.max(...lines.slice(1).map((line) => Number(line.split(',')[0]) || 0)) + 1

// Fila de prueba: usa un degradado, un rgba y dos colores con nombre compuesto.
const specialColors = 'Multicolor, Transparente, Azul Francia, Verde Fluor'
const patchedCsv = [
  ...lines,
  `${nextId},Prueba de colores,juguetes,"$1.000",stock,,TRUE,"${specialColors}",Colores de prueba,TRUE`,
].join('\n')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
const consoleErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})

await page.route('**/*output=csv*', (route) =>
  route.fulfill({ status: 200, contentType: 'text/csv; charset=utf-8', body: patchedCsv }),
)

const readSwatches = () =>
  page.evaluate(() => {
    const card = [...document.querySelectorAll('.product-card')].find((node) =>
      node.querySelector('h3')?.innerText.trim() === 'Prueba de colores',
    )
    if (!card) return null
    return [...card.querySelectorAll('[title]')].map((node) => {
      const style = getComputedStyle(node)
      return {
        name: node.getAttribute('title'),
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
      }
    })
  })

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForFunction(
  () => document.body.innerText.includes('Prueba de colores'),
  { timeout: 25000 },
)

const swatches = (await readSwatches()) ?? []
console.log('\n── Planilla (con red real) ──')
console.log(`Muestras pintadas: ${swatches.length} (esperado: 4)`)
for (const swatch of swatches) {
  console.log(
    ` · ${swatch.name}: background-color=${swatch.backgroundColor} background-image=${swatch.backgroundImage.slice(0, 46)}`,
  )
}

const byName = (name) => swatches.find((swatch) => swatch.name === name)

// Recarga: ahora el catálogo sale de la copia guardada en el navegador.
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForFunction(
  () => document.body.innerText.includes('Prueba de colores'),
  { timeout: 25000 },
)
const cached = (await readSwatches()) ?? []
console.log('\n── Recarga (desde la copia en localStorage) ──')
console.log(`Muestras pintadas: ${cached.length} (esperado: 4)`)

await browser.close()

const byNameCached = (name) => cached.find((swatch) => swatch.name === name)

const uiChecks = [
  ['la fila de prueba aparece con sus 4 colores', swatches.length === 4],
  [
    '"Multicolor" se pinta como degradado',
    byName('Multicolor')?.backgroundImage?.includes('linear-gradient'),
  ],
  [
    '"Transparente" se pinta como rgba translúcido',
    byName('Transparente')?.backgroundColor?.startsWith('rgba('),
  ],
  [
    '"Azul Francia" se pinta con su color (#3B82F6)',
    byName('Azul Francia')?.backgroundColor === 'rgb(59, 130, 246)',
  ],
  [
    '"Verde Fluor" se pinta con su color (#84CC16)',
    byName('Verde Fluor')?.backgroundColor === 'rgb(132, 204, 22)',
  ],
  ['tras recargar, la copia guardada conserva los 4 colores', cached.length === 4],
  [
    'tras recargar, el degradado sigue intacto',
    byNameCached('Multicolor')?.backgroundImage?.includes('linear-gradient'),
  ],
  [
    'tras recargar, el rgba sigue intacto',
    byNameCached('Transparente')?.backgroundColor?.startsWith('rgba('),
  ],
  ['sin errores de consola', consoleErrors.length === 0],
]

console.log('')
for (const [label, ok] of uiChecks) console.log(`${ok ? '✓' : '✗'} ${label}`)

const ok = checks.every(([, passed]) => passed) && uiChecks.every(([, passed]) => passed)
console.log(`\nResultado: ${ok ? 'OK' : 'FALLA'}`)
process.exit(ok ? 0 : 1)
