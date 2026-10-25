/**
 * Diccionario de colores de filamento de Faq3D.
 *
 * Se usa para normalizar nombres de colores escritos a mano en Google Sheets:
 * mayúsculas/minúsculas, tildes, espacios extra y variaciones usadas en el
 * negocio se convierten a un valor canónico. El tratamiento ignora tildes y
 * pasa todo a minúsculas antes de buscar.
 *
 * Ojo: un valor NO siempre es un hex. Los efectos especiales (degradados) y
 * el color "transparente" son funciones CSS, así que el valor canónico se
 * valida con `normalizeColorValue` y no con un simple /^#/.
 */

/**
 * Nombre del color -> valor CSS.
 * Los degradados ("multicolor", "arcoiris", "galaxy") se usan tal cual en la
 * muestra de color de la tarjeta.
 */
export const FILAMENT_COLOR_MAP = {
  // --- Colores Básicos y Neutros ---
  blanco: '#FFFFFF',
  negro: '#1E293B',
  gris: '#64748B',
  'gris oscuro': '#334155',
  plata: '#C0C0C0',
  transparente: 'rgba(255, 255, 255, 0.4)',

  // --- Rojos y Rosas ---
  rojo: '#EF4444',
  'rojo oscuro': '#991B1B',
  rosa: '#EC4899',
  magenta: '#D946EF',
  fucsia: '#F43F5E',
  'pastel rosa': '#FBCFE8',

  // --- Azules y Celestes ---
  celeste: '#0088DD', // Tono oficial Faq3D
  azul: '#2563EB',
  'azul marino': '#1E3A8A',
  'azul francia': '#3B82F6',
  turquesa: '#14B8A6',
  'pastel celeste': '#BAE6FD',

  // --- Verdes ---
  verde: '#22C55E',
  'verde oscuro': '#166534',
  'verde fluor': '#84CC16',
  'verde manzana': '#10B981',
  'verde militar': '#4D7C0F',
  'pastel verde': '#BBF7D0',

  // --- Amarillos y Naranjas ---
  amarillo: '#EAB308',
  'amarillo fluor': '#FCC000',
  naranja: '#F97316',
  'pastel amarillo': '#FEF08A',
  'pastel naranja': '#FFEDD5',

  // --- Violetas y Morados ---
  violeta: '#8B5CF6',
  morado: '#6D28D9',
  lila: '#C084FC',
  'pastel violeta': '#E9D5FF',

  // --- Marrones, Dorados y Especiales ---
  marron: '#78350F',
  chocolate: '#451A03',
  piel: '#FDBA74',
  dorado: '#D4AF37',
  bronce: '#B45309',
  cobre: '#B87333',

  // --- Efectos Especiales (Gradientes / Multicapa) ---
  multicolor: 'linear-gradient(135deg, #EC4899, #8B5CF6, #0088DD, #22C55E)',
  arcoiris: 'linear-gradient(135deg, #EF4444, #F97316, #EAB308, #22C55E, #0088DD, #8B5CF6)',
  galaxy: 'linear-gradient(135deg, #1E293B, #475569, #94A3B8)',
}

/** Claves canónicas del diccionario (para validaciones, ayuda y UI). */
export const FILAMENT_COLOR_NAMES = Object.keys(FILAMENT_COLOR_MAP)
  .map((key) => ({
    key,
    name: normalizeColorName(key),
    hex: FILAMENT_COLOR_MAP[key],
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

/**
 * Normaliza un nombre de color para indexing:
 * - minúsculas
 * - sin tildes
 * - espacios normalizados
 */
export function normalizeColorName(text) {
  if (typeof text !== 'string') return ''
  return removeAccents(text.toLowerCase().replace(/\s+/g, ' ').trim())
}

/**
 * Convierte nombres de colores separados por coma en array de objetos
 * { name, hex }. Acepta las dos formas que se usan en la planilla:
 *
 *   'Blanco, Negro, Celeste'
 *   'Blanco:#FFFFFF, Negro, Multicolor'
 *
 * Si el nombre no está en el diccionario se conserva el nombre original y
 * hex = ''. Si viene un valor explícito ("Blanco:#FFFFFF"), se respeta ese
 * valor; si no es un color válido, se usa el del diccionario.
 *
 * Ejemplo:
 *   parseFilamentColors('Blanco, Negro, Celeste')
 *   -> [{ name: 'Blanco', hex: '#FFFFFF' }, { name: 'Negro', hex: '#1E293B' }, { name: 'Celeste', hex: '#0088DD' }]
 */
export function parseFilamentColors(text) {
  if (!text || typeof text !== 'string') return []

  return text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part)
    .map((raw) => {
      // "Nombre:#FFFFFF" -> nombre y valor por separado.
      const separator = raw.indexOf(':')
      const name = (separator > 0 ? raw.slice(0, separator) : raw).trim()
      const explicit = separator > 0 ? raw.slice(separator + 1).trim() : ''
      const normalized = normalizeColorName(name)
      const fromMap = FILAMENT_COLOR_MAP[normalized]

      return {
        name,
        hex: normalizeColorValue(explicit) || fromMap || '',
        normalized,
        fromMap: Boolean(fromMap),
      }
    })
    .filter((color) => color.name)
}

/**
 * Remueve acentos y diacríticos del texto.
 */
function removeAccents(string) {
  return string.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Hex canónico para un nombre, o '' si no está en el diccionario. */
export function hexFromColorName(name) {
  if (typeof name !== 'string') return ''
  return FILAMENT_COLOR_MAP[normalizeColorName(name)] || ''
}

/** Nombre canónico asociado a un valor, o null si no existe. */
export function colorNameFromHex(hex) {
  if (typeof hex !== 'string') return null
  const normalizedHex = String(hex).trim().toUpperCase().replace(/^#/, '')
  for (const [name, value] of Object.entries(FILAMENT_COLOR_MAP)) {
    const normalizedValue = String(value).trim().toUpperCase().replace(/^#/, '')
    if (normalizedHex === normalizedValue) return name
  }
  return null
}

// --- Validación de valores CSS ------------------------------------------------

const HEX_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const CSS_FUNCTION_PATTERN = /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\([^()]*\)$/i
const GRADIENT_PATTERN = /^(?:repeating-)?(?:linear|radial|conic)-gradient\(.+\)$/i

/**
 * Valida un valor de color y lo devuelve normalizado, o '' si no es un color.
 *
 * Acepta hex (#FFF, #FFFFFF, #FFFFFFAA), funciones CSS (rgb, rgba, hsl...),
 * degradados (linear-gradient, radial-gradient, conic-gradient) y el
 * keyword "transparent". Los degradados y el rgba se usan tal cual: si se
 * pasaran por un filtro de hex, el efecto especial se perdería.
 */
export function normalizeColorValue(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  if (raw.toLowerCase() === 'transparent') return 'transparent'

  if (HEX_PATTERN.test(raw)) {
    const hex = raw.toUpperCase()
    // #RGBA -> #RRGGBBAA
    if (hex.length === 4) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}${hex[4]}${hex[4]}`
    }
    return hex
  }

  if (GRADIENT_PATTERN.test(raw) || CSS_FUNCTION_PATTERN.test(raw)) return raw

  return ''
}

/** ¿El valor es un degradado? (necesita background-image, no background-color) */
export function isGradientColor(value) {
  return GRADIENT_PATTERN.test(String(value ?? '').trim())
}

/**
 * Estilo CSS para pintar la muestra de color de la tarjeta.
 * Los degradados van en background-image; el resto, en background-color.
 */
export function colorSwatchStyle(value) {
  const css = normalizeColorValue(value)
  if (!css) return { backgroundColor: 'transparent' }
  if (isGradientColor(css)) return { backgroundImage: css }
  return { backgroundColor: css }
}

/** Orden deseado al presentar la paleta en UI (primero los más usados). */
export const FILAMENT_COLOR_ORDER = [
  'blanco',
  'negro',
  'gris',
  'gris oscuro',
  'plata',
  'transparente',
  'rojo',
  'rojo oscuro',
  'rosa',
  'pastel rosa',
  'magenta',
  'fucsia',
  'celeste',
  'azul',
  'azul marino',
  'azul francia',
  'turquesa',
  'pastel celeste',
  'verde',
  'verde oscuro',
  'verde fluor',
  'verde manzana',
  'verde militar',
  'pastel verde',
  'amarillo',
  'amarillo fluor',
  'naranja',
  'pastel amarillo',
  'pastel naranja',
  'violeta',
  'morado',
  'lila',
  'pastel violeta',
  'marron',
  'chocolate',
  'piel',
  'dorado',
  'bronce',
  'cobre',
  'multicolor',
  'arcoiris',
  'galaxy',
]

/**
 * Lista de colores normalizados, ordenada según FILAMENT_COLOR_ORDER o por
 * nombre si no está en el orden definido.
 */
export function sortedFilamentColors(colors) {
  if (!Array.isArray(colors)) return []

  const index = new Map(
    FILAMENT_COLOR_ORDER.map((key, position) => [normalizeColorName(key), position]),
  )
  const last = FILAMENT_COLOR_ORDER.length

  return [...colors].sort((a, b) => {
    const positionA = index.has(a.normalized) ? index.get(a.normalized) : last + a.name.length
    const positionB = index.has(b.normalized) ? index.get(b.normalized) : last + b.name.length
    if (positionA !== positionB) return positionA - positionB
    return a.name.localeCompare(b.name)
  })
}
