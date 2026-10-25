/** @format */

import { normalizeCategoryId } from '../config/categories.js'
import { isValidPrice } from '../config/constants.js'
import { hexFromColorName, normalizeColorValue, parseFilamentColors } from '../config/colors.js'

/**
 * Productos de Faq3D cargados desde Google Sheets en producción.
 * Cuando SHEETS está vacío, Elections fallback a este archivo local con la misma
 * forma del modelo.
 *
 * ESTA COPIA ES EL RESPALDO, NO LA FUENTE DE VERDAD: la planilla manda.
 * Tiene que reflejar los mismos productos, precios y estados que la planilla
 * (mismo criterio que en useProducts.js: solo `active = TRUE`), porque si la
 * red falla se muestra esto. Con precios viejos el cliente ve información
 * que no corresponde, así que hay que actualizarla junto con la planilla.
 *
 * Copiado de la planilla el 20/10/2026 (fila "esto es un test" excluida: es
 * una fila de prueba, no un producto para vender).
 */

export const CATEGORIES = [
  {
    id: 'juguetes',
    label: 'Juguetes Sensoriales & Articulados',
    shortLabel: 'Juguetes',
    description: 'Dragones, dinosaurios, pulpos y fidgets impresos capa por capa.',
    tint: '#2F9BDB',
  },
  {
    id: 'munecos',
    label: 'Muñecos & Figuras',
    shortLabel: 'Muñecos',
    description: 'Personajes de cultura pop y figuras para decorar.',
    tint: '#D9724F',
  },
  {
    id: 'llaveros',
    label: 'Llaveros',
    shortLabel: 'Llaveros',
    description: 'Llaveros con nombre, personajes y modelos de souvenir.',
    tint: '#8B6BC9',
  },
  {
    id: 'accesorios',
    label: 'Accesorios',
    shortLabel: 'Accesorios',
    description: 'Soportes y organizadores para el escritorio y el día a día.',
    tint: '#4E9A6B',
  },
]

// Paleta de filamento compartida por los productos de respaldo.
const COLORS = {
  blanco: { name: 'Blanco', hex: '#FFFFFF' },
  negro: { name: 'Negro', hex: '#1E293B' },
  gris: { name: 'Gris', hex: '#64748B' },
  verde: { name: 'Verde', hex: '#22C55E' },
  violeta: { name: 'Violeta', hex: '#8B5CF6' },
  azul: { name: 'Azul', hex: '#2563EB' },
  rosa: { name: 'Rosa', hex: '#EC4899' },
}

const BASE_COLORS = [COLORS.blanco, COLORS.negro, COLORS.gris, COLORS.verde]

export const PRODUCTS = [
  {
    id: '11',
    name: 'Naruto anime',
    category: 'munecos',
    price: 12000,
    status: 'pedido',
    featured: true,
    image: '/products/placeholder.svg',
    description: 'Escultura monocolor',
    colors: [],
  },
  {
    id: '10',
    name: 'Lagarto articulado',
    category: 'juguetes',
    price: 8000,
    status: 'stock',
    featured: true,
    image: '/products/placeholder.svg',
    description: 'Lagarto de la película',
    colors: [COLORS.blanco, COLORS.verde, COLORS.violeta, COLORS.azul],
  },
  {
    id: '9',
    name: 'Clicker dumpling',
    category: 'llaveros',
    price: 4500,
    status: 'stock',
    featured: true,
    image: '/products/placeholder.svg',
    description: 'Clicker dumpling',
    colors: [COLORS.rosa, COLORS.blanco],
  },
  {
    id: '8',
    name: 'Soporte para Auriculares',
    category: 'accesorios',
    price: 4500,
    status: 'stock',
    featured: true,
    image: '/products/soporte-auriculares.svg',
    description: 'Soporte universal',
    colors: BASE_COLORS,
  },
  {
    id: '7',
    name: 'Corazon',
    category: 'llaveros',
    price: 2500,
    status: 'stock',
    featured: true,
    image: '/products/placeholder.svg',
    description: 'Corazón',
    colors: BASE_COLORS,
  },
  {
    id: '6',
    name: 'Varita Magica',
    category: 'juguetes',
    price: 8000,
    status: 'stock',
    featured: true,
    image: '/products/placeholder.svg',
    description: 'Varita mágica',
    colors: BASE_COLORS,
  },
  {
    id: '5',
    name: 'Abre latas Labios',
    category: 'llaveros',
    price: 2500,
    status: 'stock',
    featured: true,
    image: '/products/placeholder.svg',
    description: 'Abre latas',
    colors: BASE_COLORS,
  },
  {
    id: '4',
    name: 'Soporte para Celular',
    category: 'accesorios',
    price: 4000,
    status: 'pedido',
    featured: true,
    image: '/products/placeholder.svg',
    description: 'Para celulares',
    colors: BASE_COLORS,
  },
  {
    id: '3',
    name: 'Pulpo Articulado',
    category: 'llaveros',
    price: 4000,
    status: 'pedido',
    featured: true,
    image: '/products/pulpo-sensorial.svg',
    description: 'Impreso en una sola pieza',
    colors: BASE_COLORS,
  },
  {
    id: '2',
    name: 'Dragon Articulado Flexi',
    category: 'juguetes',
    price: 8000,
    status: 'stock',
    featured: true,
    image: '/products/dragon-articulado.svg',
    description: 'Impreso en una sola pieza',
    colors: BASE_COLORS,
  },
]

/** Parsea la lista de colores de un producto. */
export const parseColors = (source) => {
  if (!source || typeof source.color !== 'object' || !Array.isArray(source.color)) {
    // Si el producto viene como string CSV, queremos cols[0] (blanco, negro, etc), o similar.
    return []
  }

  // source: [{name,hex}]
  return source
    .map(({ name, hex }) => {
      const cleanName = String(name ?? '').trim()
      if (!cleanName) return null
      return {
        name: cleanName,
        // Un color puede ser un degradado o un rgba, no solo un hex.
        hex: normalizeColorValue(hex) || hexFromColorName(cleanName),
      }
    })
    .filter(Boolean)
}

/** Number normalizado (sin float problemático) usado para armar el front. */
export const normalizeProductNumber = (value) =>
  typeof value === 'string' ? parseInt(value, 10) : value

/** Color validado (hex, rgba o degradado). */
export const normalizeHex = (value) => normalizeColorValue(value)

/** De la lista del diccionario al modelo { name, hex } del producto. */
const toColorModel = ({ name, hex }) => ({ name, hex })

/**
 * Parsear colores desde CSV.
 * Acepta "Blanco, Negro" y "Blanco:#FFFFFF, Negro": los nombres se resuelven
 * con el diccionario de filamento (src/config/colors.js).
 */
export const parseColorsFromCSV = (value) => parseFilamentColors(value).map(toColorModel)

/** Parsear colors desde CSV con archivo separado por ':' */
export const parseColorsCSV = (value) => parseFilamentColors(value).map(toColorModel)

/** Simplifica el modelo hacia planos de producto y color. */
export const mapProductFields = ({ id, name, category, price, status, image, description, colors, featured, stock }) => ({
  id: String(id).trim(),
  name: String(name).trim(),
  category: normalizeCategoryId(category),
  price: parseInt(String(price ?? '0').replace(/[$, ]/g, ''), 10) || 0,
  status: (status ?? '').toLowerCase() === 'stock' ? 'stock' : 'pedido',
  image: String(image ?? '').trim(),
  description: String(description ?? '').trim(),
  colors: Array.isArray(colors) ? colors : typeof colors === 'string' ? parseColorsCSV(colors) : [],
  featured: !!(featured || (stock && stock.status === 'featured')),
  stock: stock && typeof stock === 'object' ? stock : null,
  inventory: stock && Array.isArray(stock?.inventory) ? stock.inventory : [],
})

/** Fallback a datos locales cuando Sheets no responde. */
export const productsLocalFallback = () =>
  PRODUCTS.map((p) => ({
    ...p,
    category: normalizeCategoryId(p.category),
    colors: Array.isArray(p.colors) ? p.colors : [],
  }))

export const STATUS_STYLES = {
  stock: {
    label: 'En Stock',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  pedido: {
    label: 'A Pedido',
    badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  },
}

export const CATEGORIES_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// Las etiquetas aceptan tanto el id del sitio ("munecos") como el texto tal
// como lo escribe la planilla ("Muñecos & Figuras"): si no, el rótulo de la
// tarjeta caía en "Catálogo" aunque el producto estuviera bien clasificado.
export const categoryLabel = (id) => CATEGORIES_BY_ID[normalizeCategoryId(id)]?.label ?? 'Catálogo'
export const categoryTint = (id) => CATEGORIES_BY_ID[normalizeCategoryId(id)]?.tint ?? '#16130F'
export const categoryShortLabel = (id) => CATEGORIES_BY_ID[normalizeCategoryId(id)]?.shortLabel ?? 'Catálogo'

export const productsByCategory = (categoryId) =>
  PRODUCTS.filter((p) => normalizeCategoryId(p.category) === normalizeCategoryId(categoryId))

export const stockProducts = PRODUCTS.filter((p) => (p.status || '').toLowerCase() === 'stock')

export const featuredProducts = PRODUCTS.filter((p) => !!(p.featured || false))

export const productNumber = (productId, list = PRODUCTS) => {
  const index = (list || []).findIndex((p) => String(p.id).toLowerCase() === String(productId).toLowerCase())
  return index === -1 ? '01' : String(index + 1).padStart(2, '0')
}

export const inventoryStatus = (p) =>
  (p.inventory || []).filter((i) => i?.value).map((i) => ({
    type: i.type || 'stock',
    quantity: String(i.quantity).trim(),
    status: i.type === 'stock' ? 'stock' : 'pedido',
    label: i.value || '',
  }))

export const productsFromSheet = false

// CSV helpers separados para mantener la api simple.

export const parseColorsCSVSingle = (raw) => {
  if (!raw || typeof raw !== 'string') return []
  const lines = raw.split('\n').filter((l) => l.trim())
  return lines.flatMap((line) => parseFilamentColors(line).map(toColorModel))
}

// Atajos de consulta para los componentes de la landing.
export const getCategoryById = (id) => CATEGORIES_BY_ID[normalizeCategoryId(id)] || null

export const colorNameFromHex = (hex) => {
  if (!hex) return ''
  const match = PRODUCTS.flatMap((p) => p.colors || []).find((c) => c.hex?.toUpperCase() === hex.toUpperCase())
  return match?.name || ''
}

// Solo cuenta precios publicables: el respaldo tampoco debe anunciar un
// "Desde" con una cifra de relleno.
const PUBLISHABLE_PRICES = PRODUCTS.map((p) => p.price).filter(isValidPrice)

export const CATALOG_STATS = {
  total: PRODUCTS.length,
  stock: stockProducts.length,
  minPrice: PUBLISHABLE_PRICES.length ? Math.min(...PUBLISHABLE_PRICES) : 0,
  categories: CATEGORIES.length,
}

