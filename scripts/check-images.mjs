/**
 * Diagnóstico de fotos del catálogo.
 *
 * Lee la planilla publicada y, para cada producto visible, comprueba que la
 * foto que va a usar la web exista de verdad:
 *
 *   node scripts/check-images.mjs
 *
 * Revisa las tres formas de la columna `image` (URL directa, nombre de archivo
 * en public/products/ y link de Google Drive) y dice, punto por punto, dónde
 * está la falla. Útil cuando "la web no muestra las fotos": distingue un
 * problema de la planilla (link privado, archivo que no existe) de un problema
 * de la app (formato no reconocido).
 *
 * Salida: exit 0 si todas las fotos cargan, exit 1 si alguna no.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { GOOGLE_SHEETS_CSV_URL } from '../src/config/constants.js'
import { normalizeSheetImage, normalizeSheetVideo } from '../src/hooks/useProducts.js'
import { isVideoSource } from '../src/config/media.js'

const PLACEHOLDER = '/products/placeholder.svg'
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const csv = await fetch(GOOGLE_SHEETS_CSV_URL, { cache: 'no-store' }).then((response) => {
  if (!response.ok) throw new Error(`La planilla respondió ${response.status}`)
  return response.text()
})

const rows = parseCsv(csv)
const header = (rows[0] ?? []).map((column) => column.trim().toLowerCase())
const cell = (record, column) => (record[header.indexOf(column)] ?? '').trim()

const products = rows
  .slice(1)
  .filter((record) => cell(record, 'name'))
  .filter((record) => !header.includes('active') || isTrue(cell(record, 'active')))

const problems = []
const lines = []

for (const record of products) {
  const name = cell(record, 'name')
  const raw = cell(record, 'image')
  const src = normalizeSheetImage(raw)

  if (src === PLACEHOLDER) {
    const state = raw ? `no se reconoce como imagen: "${raw}"` : 'sin foto en la planilla'
    lines.push(`· ${name}: ${state} -> placeholder`)
    if (raw) problems.push(`${name}: "${raw}" no es una imagen reconocible`)
    continue
  }

  const kind = isVideoSource(src) ? 'video' : 'foto'
  const status = await checkImage(src)
  lines.push(
    `${status.ok ? 'OK ' : 'NO '} [${kind}] ${name}: ${src}${status.note ? ` (${status.note})` : ''}`,
  )
  if (!status.ok) problems.push(`${name}: ${status.note}`)

  // Columna `video`: un clip aparte de la foto, en Drive o como archivo.
  const rawVideo = cell(record, 'video')
  if (rawVideo) {
    const videoSrc = normalizeSheetVideo(rawVideo)
    if (!videoSrc) {
      lines.push(`· ${name}: el video "${rawVideo}" no se reconoce -> se ignora`)
      problems.push(`${name}: "${rawVideo}" no es un video reconocible`)
      continue
    }

    const video = await checkVideo(videoSrc)
    lines.push(`${video.ok ? 'OK ' : 'NO '} [clip] ${name}: ${videoSrc}${video.note ? ` (${video.note})` : ''}`)
    if (!video.ok) problems.push(`${name} (video): ${video.note}`)
  }
}

console.log(`\nPlanilla: ${GOOGLE_SHEETS_CSV_URL.slice(0, 70)}…`)
console.log(`Productos visibles: ${products.length}\n`)
console.log(lines.join('\n'))

if (problems.length) {
  console.log(`\n${problems.length} foto(s) con problema:`)
  for (const problem of problems) console.log(`  - ${problem}`)
  console.log(
    '\nEn Google Sheets: la foto tiene que estar subida a public/products/ (nombre de archivo)\n' +
      'o ser un link público ("Cualquier persona con el enlace"). Un link de Drive privado\n' +
      'redirige al login de Google y nunca se ve en la web.',
  )
  process.exit(1)
}

console.log('\nTodas las fotos cargan.')

/** Comprueba que la URL/ruta devuelva una imagen de verdad. */
async function checkImage(src) {
  // Ruta local: se publica desde public/.
  if (src.startsWith('/')) return checkLocalFile(src)

  try {
    let response = await fetch(src, { method: 'HEAD', redirect: 'follow' })
    let type = response.headers.get('content-type') ?? ''

    // Algunos hosts no aceptan HEAD: se confirma con un GET liviano.
    if (!response.ok || !isMediaType(type)) {
      response = await fetch(src, { redirect: 'follow' })
      type = response.headers.get('content-type') ?? ''
      await response.body?.cancel()
    }

    if (!response.ok) return { ok: false, note: `HTTP ${response.status}` }
    if (!isMediaType(type)) {
      return {
        ok: false,
        note: /accounts\.google\.com/.test(response.url)
          ? 'pide login: el archivo no es público'
          : `devuelve ${type || 'sin content-type'}, no una imagen ni un video`,
      }
    }

    return { ok: true, note: '' }
  } catch (error) {
    return { ok: false, note: error.message }
  }
}

/** CSV -> registros, respetando comillas y saltos de línea internos. */
function parseCsv(text) {
  const records = []
  let record = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"'
          i += 1
        } else inQuotes = false
      } else field += char
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }
    if (char === ',') {
      record.push(field.trim())
      field = ''
      continue
    }
    if (char === '\r') {
      if (next === '\n') i += 1
      record.push(field.trim())
      records.push(record)
      record = []
      field = ''
      continue
    }
    if (char === '\n') {
      record.push(field.trim())
      records.push(record)
      record = []
      field = ''
      continue
    }
    field += char
  }

  if (field !== '' || record.length) {
    record.push(field.trim())
    records.push(record)
  }

  return records
}

/**
 * Un clip: archivo local, URL de video o el reproductor embebido de Drive.
 * Para Drive no se puede validar el tipo (el embed devuelve HTML), así que se
 * comprueba que no termine en el login de Google.
 */
async function checkVideo(src) {
  if (src.startsWith('/')) return checkLocalFile(src)

  try {
    const response = await fetch(src, { method: 'HEAD', redirect: 'follow' })
    const type = response.headers.get('content-type') ?? ''

    if (/accounts\.google\.com/.test(response.url)) {
      return { ok: false, note: 'pide login: el archivo no es público' }
    }
    if (src.includes('drive.google.com/file/')) {
      return response.ok
        ? { ok: true, note: '' }
        : { ok: false, note: `HTTP ${response.status}` }
    }
    if (!response.ok) return { ok: false, note: `HTTP ${response.status}` }
    if (!type.startsWith('video/')) {
      return { ok: false, note: `devuelve ${type || 'sin content-type'}, no un video` }
    }
    return { ok: true, note: '' }
  } catch (error) {
    return { ok: false, note: error.message }
  }
}

function checkLocalFile(src) {
  const file = path.join(projectRoot, 'public', src.replace(/^\//, '').split('?')[0])
  const found = existsSync(file) || existsSync(decodeURIComponent(file))
  return {
    ok: found,
    note: found ? '' : `falta el archivo public${decodeURIComponent(src)}`,
  }
}

/** Imagen o video: lo único que la tarjeta puede mostrar. */
function isMediaType(type) {
  return type.startsWith('image/') || type.startsWith('video/')
}

function isTrue(value) {
  return ['true', '1', 'si', 'sí', 'x', 'verdadero'].includes(String(value).toLowerCase())
}
