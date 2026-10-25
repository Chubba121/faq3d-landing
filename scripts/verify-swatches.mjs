/**
 * Prueba de posición de las muestras de color (swatches).
 *
 * Comprueba que los círculos de color:
 *   1. vivan dentro del contenedor de la imagen (debajo de la foto),
 *   2. no empujen la columna de texto (en el estante, el texto de la derecha
 *      tiene que arrancar en el mismo alto que la foto),
 *   3. conserven su estilo (círculo, borde de 1px, 12x12).
 *
 * Se corre en desktop y en mobile: el layout del estante cambia (imagen al
 * lado del texto en desktop, apilado en mobile) y el chequeo se adapta a la
 * geometría real, no a la clase de Tailwind.
 *
 *   node scripts/verify-swatches.mjs [url]
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? process.env.URL ?? 'http://localhost:5173/'

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 1100 },
  { label: 'mobile', width: 390, height: 900 },
]

const browser = await chromium.launch()
const consoleErrors = []
let failures = 0
let checkedCards = 0

for (const viewport of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(String(error)))

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page
    .waitForFunction(
      () => /LISTADO EN VIVO DESDE LA PLANILLA|CATÁLOGO LOCAL DE RESPALDO/.test(document.body.innerText),
      { timeout: 25000 },
    )
    .catch(() => console.log('! el catálogo no llegó a resolverse después de 25s'))
  await page.waitForTimeout(1200)

  const report = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.product-card')]
    const results = []

    for (const card of cards) {
      const img = card.querySelector('img')
      const imageBox = img?.parentElement
      // La columna de texto es el bloque flex-1 que contiene el nombre.
      const textBox = card.querySelector('div.flex-1')
      if (!img || !imageBox || !textBox) continue

      const isSwatch = (node) => /rounded-full/.test(node.className ?? '')
      // Todos los swatches de la tarjeta, estén donde estén.
      const allSwatches = [...card.querySelectorAll('span[title]')].filter(isSwatch)
      // Swatches dentro del contenedor de la imagen (donde deben estar).
      const swatches = [...imageBox.querySelectorAll('span[title]')].filter(isSwatch)
      // Swatches que quedaron fuera del marco de la foto (el error a evitar).
      const straySwatches = allSwatches.filter((node) => !imageBox.contains(node))

      const imgRect = img.getBoundingClientRect()
      const swatchRects = swatches.map((node) => node.getBoundingClientRect())
      const style = swatches[0] ? getComputedStyle(swatches[0]) : null
      const imageRect = imageBox.getBoundingClientRect()
      const textRect = textBox.getBoundingClientRect()
      // Layout real: al lado (estante en desktop) o apilado (mobile / tarjeta).
      const sideBySide = textRect.left >= imageRect.right - 1

      results.push({
        name: card.querySelector('h3')?.innerText?.trim() ?? '(sin nombre)',
        sideBySide,
        swatchCount: swatches.length,
        allSwatchCount: allSwatches.length,
        straySwatchCount: straySwatches.length,
        // Los swatches tienen que quedar por debajo de la foto.
        belowImage: swatchRects.length
          ? Math.min(...swatchRects.map((rect) => rect.top)) >= imgRect.bottom - 1
          : true,
        // Al lado, el texto arranca en el mismo alto que la foto (los swatches
        // no lo empujan). Apilados, el texto va debajo, también sin huecos.
        textAligned: sideBySide
          ? Math.abs(imageRect.top - textRect.top) <= 1
          : textRect.top >= imageRect.bottom - 1,
        radius: style?.borderRadius ?? '',
        borderWidth: style?.borderWidth ?? '',
        width: style?.width ?? '',
        height: style?.height ?? '',
      })
    }

    return results
  })

  const withSwatches = report.filter((row) => row.allSwatchCount > 0)
  checkedCards += withSwatches.length

  console.log(`\n── ${viewport.label} (${viewport.width}px) ──`)
  console.log(`Tarjetas con muestras de color: ${withSwatches.length}`)
  for (const row of withSwatches) {
    const ok =
      row.straySwatchCount === 0 &&
      row.swatchCount === row.allSwatchCount &&
      row.belowImage &&
      row.textAligned &&
      row.radius === '9999px' &&
      row.borderWidth === '1px' &&
      row.width === '12px' &&
      row.height === '12px'
    if (!ok) failures += 1
    console.log(
      ` ${ok ? 'OK  ' : 'FALLA'} ${row.name}${row.sideBySide ? ' [al lado]' : ''} · ` +
        `${row.swatchCount}/${row.allSwatchCount} swatches en la imagen · ` +
        `debajo de la foto=${row.belowImage} · texto alineado=${row.textAligned} · ` +
        `sueltos fuera de la foto=${row.straySwatchCount} · ` +
        `${row.width}x${row.height} r=${row.radius} borde=${row.borderWidth}`,
    )
  }

  if (withSwatches.length === 0) {
    failures += 1
    console.log(' FALLA no se encontró ninguna tarjeta con colores')
  }

  await page.screenshot({ path: `.screens/swatches-${viewport.label}.png`, fullPage: false })

  // Evidencia visual: una tarjeta de la vidriera y una del estante.
  const firstCard = await page.$('.product-card')
  if (firstCard) await firstCard.screenshot({ path: `.screens/swatches-vidriera-${viewport.label}.png` })

  const shelfCard = await page.$('.product-card.sm\\:flex-row')
  if (shelfCard) await shelfCard.screenshot({ path: `.screens/swatches-estante-${viewport.label}.png` })

  await page.close()
}

if (consoleErrors.length) {
  console.log('\nErrores de consola:')
  for (const error of consoleErrors) console.log(' !', error)
}

await browser.close()

console.log(`\nTarjetas verificadas: ${checkedCards}`)
console.log(`Resultado: ${failures === 0 && consoleErrors.length === 0 ? 'OK' : `FALLA (${failures})`}`)
process.exit(failures === 0 && consoleErrors.length === 0 ? 0 : 1)
