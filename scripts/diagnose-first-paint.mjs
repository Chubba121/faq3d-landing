/**
 * Diagnóstico del primer pintado.
 *
 * Mide, en una carga real de la landing:
 *  - qué productos se ven en el primer pintado (antes de que resuelva el CSV),
 *  - cuánto tarda en aparecer cada estante del catálogo,
 *  - si el catálogo cambia (parpadeo de datos) después de cargar.
 *
 * Se prueban dos escenarios en el MISMO contexto (mismo localStorage):
 *   1. primera visita (sin copia en localStorage),
 *   2. recarga (con copia en localStorage).
 *
 *   node scripts/diagnose-first-paint.mjs [url]
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? process.env.URL ?? 'http://localhost:5173/'

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
const page = await context.newPage()

const readShelves = () =>
  page.evaluate(() => {
    const shelves = {}
    for (const node of document.querySelectorAll('[id^="catalogo-categoria-"]')) {
      const id = node.id.replace('catalogo-categoria-', '')
      shelves[id] = {
        count: node.querySelector('p')?.innerText?.trim() ?? '',
        names: [...node.querySelectorAll('.product-card h3')].map((n) => n.innerText.trim()),
        empty: Boolean(node.querySelector('.archive-empty')),
      }
    }
    return {
      shelves,
      origin: document.body.innerText.match(/LISTADO EN VIVO|CATÁLOGO LOCAL|CATALOGO LOCAL/i)?.[0] ?? null,
      loading: /cargando/i.test(document.body.innerText),
    }
  })

const readCache = () =>
  page.evaluate(() => {
    const raw = window.localStorage.getItem('faq3d:catalog:v2')
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return {
        lastUpdated: parsed.lastUpdated,
        hiddenCount: parsed.hiddenCount,
        products: (parsed.products ?? []).map((p) => `${p.id}|${p.name}|${p.category}|${p.status}`),
      }
    } catch {
      return 'corrupta'
    }
  })

async function runScenario(label) {
  const started = Date.now()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })

  const firstPaint = await readShelves()

  const timeline = []
  const seen = new Set()
  const deadline = Date.now() + 25000
  while (Date.now() < deadline) {
    const state = await readShelves()
    for (const [id, shelf] of Object.entries(state.shelves)) {
      for (const name of shelf.names) {
        const key = `${id}:${name}`
        if (!seen.has(key)) {
          seen.add(key)
          timeline.push({ at: Date.now() - started, shelf: id, name })
        }
      }
    }
    if (!state.loading && state.origin?.toUpperCase().includes('LISTADO EN VIVO')) break
    await page.waitForTimeout(60)
  }

  const final = await readShelves()
  const cache = await readCache()

  console.log(`\n=========== ${label} ===========`)
  console.log('Primer pintado (DOM legible):')
  for (const [id, shelf] of Object.entries(firstPaint.shelves)) {
    console.log(
      ` · ${id}: ${shelf.names.length ? shelf.names.join(', ') : shelf.empty ? '(VACÍO)' : '(skeleton)'}` +
        ` [${shelf.count}]`,
    )
  }
  console.log(` · origen=${firstPaint.origin} · cargando=${firstPaint.loading}`)

  console.log('Cronología de aparición:')
  for (const entry of timeline) console.log(` · ${entry.at}ms  ${entry.shelf} -> ${entry.name}`)

  console.log('Estado final:')
  for (const [id, shelf] of Object.entries(final.shelves)) {
    console.log(
      ` · ${id}: ${shelf.names.join(', ') || (shelf.empty ? '(VACÍO)' : '(skeleton)')} [${shelf.count}]`,
    )
  }
  console.log(' · origen=', final.origin)
  console.log(' · cache=', JSON.stringify(cache))
}

// 1) Primera visita: sin copia local.
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.evaluate(() => window.localStorage.clear())
await runScenario('1) Primera visita (sin copia local)')

// 2) Recarga: con la copia que dejó la primera visita.
await runScenario('2) Recarga (con copia local)')

await browser.close()
