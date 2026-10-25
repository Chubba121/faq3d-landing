/**
 * Categorías del catálogo de Faq3D.
 *
 * La planilla las escribe como le sale: "Muñecos & Figuras", "Juguetes",
 * "llaveros"... Cada valor tiene que terminar mapeado al id del sitio
 * (juguetes | munecos | llaveros | accesorios) para que el producto caiga en
 * el estante correcto.
 *
 * Esta normalización se aplica en TODOS los caminos que traen productos
 * (planilla, copia guardada en el navegador y catálogo local de respaldo). Si
 * un solo camino se saltea, un dato viejo deja un estante vacío hasta que
 * llega la planilla: el cliente ve el catálogo incompleto al recargar.
 */

/** Ids de categoría que usa el sitio (los de CATEGORIES en src/data/products.js). */
export const CATEGORY_IDS = ['juguetes', 'munecos', 'llaveros', 'accesorios']

/**
 * Alias de la planilla -> id del sitio.
 * Las claves ya están normalizadas (sin tildes y con " y " en vez de "&").
 */
const CATEGORY_ALIASES = {
  juguetes: 'juguetes',
  juguete: 'juguetes',
  'juguetes sensoriales': 'juguetes',
  'juguetes sensoriales y articulados': 'juguetes',
  'juguetes sensoriales articulados': 'juguetes',
  munecos: 'munecos',
  muneco: 'munecos',
  'munecos y figuras': 'munecos',
  'muneco y figura': 'munecos',
  'munecos figuras': 'munecos',
  figuras: 'munecos',
  figura: 'munecos',
  llaveros: 'llaveros',
  llavero: 'llaveros',
  accesorios: 'accesorios',
  accesorio: 'accesorios',
}

/** Palabras clave para ubicar categorías escritas de otra forma. */
const CATEGORY_KEYWORDS = [
  ['llavero', 'llaveros'],
  ['accesorio', 'accesorios'],
  ['muneco', 'munecos'],
  ['figura', 'munecos'],
  ['juguete', 'juguetes'],
  ['sensorial', 'juguetes'],
  ['articula', 'juguetes'],
]

/**
 * Traduce la categoría escrita en la planilla ("Muñecos & Figuras") o el id del
 * sitio ("munecos") al id canónico de la categoría.
 *
 * Si no la reconoce devuelve el texto normalizado (por ejemplo "decoracion")
 * para que el producto igual se muestre en el estante "otros" y no desaparezca
 * del catálogo.
 */
export function normalizeCategoryId(raw) {
  const cleaned = stripAccents(String(raw ?? '').trim().toLowerCase())
    .replace(/\s+/g, ' ')
    .replace(/\s*&\s*/g, ' y ')
    .trim()

  if (!cleaned) return 'sin-categoria'

  if (CATEGORY_ALIASES[cleaned]) return CATEGORY_ALIASES[cleaned]

  const keyword = CATEGORY_KEYWORDS.find(([word]) => cleaned.includes(word))
  if (keyword) return keyword[1]

  return cleaned
}

/** ¿El id corresponde a una de las categorías del sitio? */
export function isKnownCategoryId(id) {
  return CATEGORY_IDS.includes(String(id ?? '').trim())
}

/** Quita tildes y diacríticos para comparar textos. */
function stripAccents(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
