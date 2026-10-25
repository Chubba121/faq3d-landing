/**
 * Auditoría mobile de la landing.
 *
 * Abre la página en varios anchos de teléfono y mide, en cada uno:
 *  - overflow horizontal (algo más ancho que la pantalla),
 *  - elementos interactivos con target menor a 44x44 (WCAG / Apple HIG),
 *  - textos con menos de 12px,
 *  - elementos que se salen del viewport,
 *  - imágenes que desbordan su contenedor.
 *
 *   node scripts/audit-mobile.mjs [url]
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? process.env.URL ?? 'http://localhost:5173/'
const WIDTHS = [320, 360, 390, 414]

const browser = await chromium.launch()

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 860 }, deviceScaleFactor: 2 })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page
    .waitForFunction(
      () => /LISTADO EN VIVO DESDE LA PLANILLA|CATÁLOGO LOCAL DE RESPALDO/.test(document.body.innerText),
      { timeout: 25000 },
    )
    .catch(() => console.log('! el catálogo no llegó a resolverse después de 25s'))
  await page.waitForTimeout(900)

  const report = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth
    const scrollWidth = document.documentElement.scrollWidth

    const rect = (node) => node.getBoundingClientRect()

    // Overflow horizontal: nodos visibles que se salen por la derecha.
    const overflowing = [...document.querySelectorAll('body *')]
      .filter((node) => {
        const style = getComputedStyle(node)
        if (style.position === 'fixed' || style.position === 'absolute') return false
        if (style.display === 'none' || style.visibility === 'hidden') return false
        // Los slides que todavía no entraron al carrusel viven fuera de la
        // pantalla a propósito (el carrusel los recorta).
        if (node.closest('[aria-roledescription="carrusel"]')) return false
        const box = rect(node)
        if (!box.width || !box.height) return false
        return box.right > docWidth + 1 || box.left < -1
      })
      .slice(0, 12)
      .map((node) => ({
        tag: node.tagName.toLowerCase(),
        cls: String(node.className ?? '').slice(0, 70),
        left: Math.round(rect(node).left),
        right: Math.round(rect(node).right),
        text: (node.innerText ?? '').trim().slice(0, 40),
      }))

    // Touch targets chicos en elementos interactivos.
    const smallTargets = [...document.querySelectorAll('a, button, input, [role="button"]')]
      .filter((node) => {
        const style = getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        if (node.closest('[aria-hidden="true"]')) return false
        // Enlaces "sr-only": invisibles salvo al enfocar con teclado.
        if (/\bsr-only\b/.test(String(node.className ?? ''))) return false
        // Enlaces dentro de una frase (excepción de WCAG 2.5.8).
        if (node.tagName === 'A' && node.closest('p')) return false
        const box = rect(node)
        return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44)
      })
      .slice(0, 20)
      .map((node) => {
        const box = rect(node)
        return {
          tag: node.tagName.toLowerCase(),
          text: (node.innerText ?? node.getAttribute('aria-label') ?? '').trim().slice(0, 32),
          w: Math.round(box.width),
          h: Math.round(box.height),
          cls: String(node.className ?? '').slice(0, 48),
        }
      })

    // Texto muy chico para mobile.
    const smallText = [...document.querySelectorAll('p, span, a, h1, h2, h3, li, label')]
      .filter((node) => {
        const style = getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        if (!(node.innerText ?? '').trim()) return false
        if (node.children.length > 0) return false
        return parseFloat(style.fontSize) < 11
      })
      .slice(0, 12)
      .map((node) => ({
        size: Math.round(parseFloat(getComputedStyle(node).fontSize) * 10) / 10,
        text: (node.innerText ?? '').trim().slice(0, 34),
      }))

    // Imágenes que se salen de su contenedor.
    const imageOverflow = [...document.querySelectorAll('img')]
      .filter((node) => {
        const parent = node.parentElement
        if (!parent) return false
        return rect(node).width > rect(parent).width + 1
      })
      .slice(0, 8)
      .map((node) => ({
        src: node.getAttribute('src')?.slice(0, 48),
        w: Math.round(rect(node).width),
        parentW: Math.round(rect(node.parentElement).width),
      }))

    return {
      docWidth,
      scrollWidth,
      horizontalOverflow: scrollWidth > docWidth + 1,
      overflowing,
      smallTargets,
      smallText,
      imageOverflow,
    }
  })

  console.log(`\n=========== ${width}px ===========`)
  console.log(`viewport=${report.docWidth} scrollWidth=${report.scrollWidth} overflow=${report.horizontalOverflow}`)
  if (report.overflowing.length) {
    console.log('-- elementos que se salen --')
    for (const row of report.overflowing) {
      console.log(` · <${row.tag}.${row.cls}> left=${row.left} right=${row.right} "${row.text}"`)
    }
  }
  if (report.smallTargets.length) {
    console.log('-- touch targets < 44px --')
    for (const row of report.smallTargets) {
      console.log(` · <${row.tag}> ${row.w}x${row.h} "${row.text}" [${row.cls}]`)
    }
  }
  if (report.smallText.length) {
    console.log('-- texto < 11px --')
    for (const row of report.smallText) console.log(` · ${row.size}px "${row.text}"`)
  }
  if (report.imageOverflow.length) {
    console.log('-- imágenes que desbordan --')
    for (const row of report.imageOverflow) {
      console.log(` · ${row.src} w=${row.w} contenedor=${row.parentW}`)
    }
  }

  await page.screenshot({ path: `.screens/mobile-${width}.png`, fullPage: true })
  await page.close()
}

await browser.close()
